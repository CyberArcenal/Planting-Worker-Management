// services/AssignmentService.js
const auditLogger = require("../utils/auditLogger");
// Import the enum from Assignment entity
const { AssignmentStatus } = require("../entities/Assignment");
const { farmSessionDefaultSessionId } = require("../utils/settings/system");

class AssignmentService {
  constructor() {
    this.repository = null;
    this.workerRepository = null;
    this.pitakRepository = null;
    this.sessionRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/datasource");
    const Assignment = require("../entities/Assignment");
    const Worker = require("../entities/Worker");
    const Pitak = require("../entities/Pitak");
    const Session = require("../entities/Session");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.repository = AppDataSource.getRepository(Assignment);
    this.workerRepository = AppDataSource.getRepository(Worker);
    this.pitakRepository = AppDataSource.getRepository(Pitak);
    this.sessionRepository = AppDataSource.getRepository(Session);
    console.log("AssignmentService initialized");
  }

  async getRepositories() {
    if (!this.repository) {
      await this.initialize();
    }
    return {
      assignment: this.repository,
      worker: this.workerRepository,
      pitak: this.pitakRepository,
      session: this.sessionRepository,
    };
  }

  /**
   * Create a new assignment – luwangCount is temporary (0). It will be recalculated by the subscriber.
   * @param {Object} data - { workerId, pitakId, sessionId, assignmentDate, notes? }
   * @param {string} user - user identifier for audit log
   */
  async create(data, user = "system") {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const {
      assignment: repo,
      worker: workerRepo,
      pitak: pitakRepo,
      session: sessionRepo,
    } = await this.getRepositories();

    try {
      // Validate required fields
      if (!data.workerId) throw new Error("workerId is required");
      if (!data.pitakId) throw new Error("pitakId is required");
      if (!data.sessionId) throw new Error("sessionId is required");
      if (!data.assignmentDate) throw new Error("assignmentDate is required");

      // Fetch related entities
      const worker = await workerRepo.findOne({ where: { id: data.workerId } });
      if (!worker) throw new Error(`Worker with ID ${data.workerId} not found`);

      const pitak = await pitakRepo.findOne({ where: { id: data.pitakId } });
      if (!pitak) throw new Error(`Pitak with ID ${data.pitakId} not found`);

      const session = await sessionRepo.findOne({
        where: { id: data.sessionId },
      });
      if (!session)
        throw new Error(`Session with ID ${data.sessionId} not found`);

      // Check uniqueness (worker + pitak + session)
      const existing = await repo.findOne({
        where: {
          worker: { id: data.workerId },
          pitak: { id: data.pitakId },
          session: { id: data.sessionId },
        },
      });
      if (existing) {
        throw new Error(
          "An assignment already exists for this worker, pitak, and session combination",
        );
      }

      // Temporary luwangCount – will be corrected by subscriber
      const luwangCount = 0;

      // Create entity
      const assignmentData = {
        worker,
        pitak,
        session,
        luwangCount,
        assignmentDate: data.assignmentDate,
        notes: data.notes,
        status: AssignmentStatus.ACTIVE,
      };

      const assignment = repo.create(assignmentData);
      const saved = await saveDb(repo, assignment);
      await auditLogger.logCreate("Assignment", saved.id, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to create assignment:", error.message);
      throw error;
    }
  }

  /**
   * Update an existing assignment – ignores status and luwangCount changes.
   * @param {number} id
   * @param {Object} data - allowed fields: notes, assignmentDate
   * @param {string} user
   */
  async update(id, data, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const { assignment: repo } = await this.getRepositories();

    try {
      const existing = await repo.findOne({
        where: { id },
        relations: ["worker", "pitak", "session"],
      });
      if (!existing) throw new Error(`Assignment with ID ${id} not found`);

      const oldData = { ...existing };

      // Prevent updates to status and luwangCount
      const allowedUpdates = {
        notes: data.notes,
        assignmentDate: data.assignmentDate,
      };
      // Remove undefined fields
      Object.keys(allowedUpdates).forEach((key) => {
        if (allowedUpdates[key] === undefined) delete allowedUpdates[key];
      });

      // If no updates allowed, just return existing
      if (Object.keys(allowedUpdates).length === 0) {
        return existing;
      }

      // Apply updates
      Object.assign(existing, allowedUpdates);
      existing.updatedAt = new Date();

      const saved = await updateDb(repo, existing);
      await auditLogger.logUpdate("Assignment", id, oldData, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to update assignment:", error.message);
      throw error;
    }
  }

  async updateStatus(id, newStatus, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const auditLogger = require("../utils/auditLogger");
    const { AssignmentStatus } = require("../entities/Assignment");
    const repo = await this.getRepository(); // assignment repository

    const assignment = await repo.findOne({ where: { id } });
    if (!assignment) throw new Error(`Assignment with ID ${id} not found`);

    const oldStatus = assignment.status;
    if (oldStatus === newStatus) return assignment;

    // Allowed transitions based on AssignmentStatus enum
    const allowedTransitions = {
      [AssignmentStatus.INITIATED]: [
        AssignmentStatus.ACTIVE,
        AssignmentStatus.COMPLETED,
        AssignmentStatus.CANCELLED,
      ],
      [AssignmentStatus.ACTIVE]: [
        AssignmentStatus.COMPLETED,
        AssignmentStatus.CANCELLED,
      ],
      [AssignmentStatus.COMPLETED]: [],
      [AssignmentStatus.CANCELLED]: [],
    };

    if (!allowedTransitions[oldStatus]?.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${oldStatus} to ${newStatus}`,
      );
    }

    assignment.status = newStatus;
    assignment.updatedAt = new Date();

    const saved = await updateDb(repo, assignment);
    await auditLogger.logUpdate(
      "Assignment",
      id,
      { status: oldStatus },
      { status: newStatus },
      user,
    );
    return saved;
  }

  /**
   * Delete (cancel) an assignment – sets status to 'cancelled'
   * @param {number} id
   * @param {string} user
   */
  async delete(id, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const { assignment: repo } = await this.getRepositories();

    try {
      const assignment = await repo.findOne({ where: { id } });
      if (!assignment) throw new Error(`Assignment with ID ${id} not found`);

      // If already cancelled, just return
      if (assignment.status === AssignmentStatus.CANCELLED) {
        return assignment;
      }

      const oldData = { ...assignment };
      assignment.status = AssignmentStatus.CANCELLED;
      assignment.updatedAt = new Date();

      const saved = await updateDb(repo, assignment);
      await auditLogger.logDelete("Assignment", id, oldData, user);
      return saved;
    } catch (error) {
      console.error("Failed to delete assignment:", error.message);
      throw error;
    }
  }

  /**
   * Find assignment by ID with relations
   * @param {number} id
   */
  async findById(id) {
    const { assignment: repo } = await this.getRepositories();

    try {
      const assignment = await repo.findOne({
        where: { id },
        relations: ["worker", "pitak", "session"],
      });
      if (!assignment) throw new Error(`Assignment with ID ${id} not found`);

      // 👇 Enforce current session
      const defaultSessionId = await farmSessionDefaultSessionId();
      if (!defaultSessionId) {
        throw new Error("No default session set. Cannot access assignment.");
      }
      if (assignment.session?.id !== defaultSessionId) {
        throw new Error(
          `Assignment #${id} does not belong to the current session`,
        );
      }

      await auditLogger.logView("Assignment", id, "system");
      return assignment;
    } catch (error) {
      console.error("Failed to find assignment:", error.message);
      throw error;
    }
  }

  /**
   * Find all assignments with optional filters – returns array (original behavior)
   * @param {Object} options - { workerId, pitakId, sessionId, status, startDate, endDate, page?, limit?, sortBy, sortOrder }
   * @returns {Promise<Assignment[]>}
   */
  async findAll(options = {}) {
    const { assignment: repo } = await this.getRepositories();
    if (!options.sessionId) {
      const defaultSessionId = await farmSessionDefaultSessionId();
      if (defaultSessionId && defaultSessionId > 0) {
        options.sessionId = defaultSessionId;
      } else {
        // No default session – return empty array (or throw)
        console.warn("No default session ID available for Assignment.findAll");
        return [];
      }
    }
    try {
      const qb = repo
        .createQueryBuilder("assignment")
        .leftJoinAndSelect("assignment.worker", "worker")
        .leftJoinAndSelect("assignment.pitak", "pitak")
        .leftJoinAndSelect("assignment.session", "session");

      // Filters
      if (options.workerId) {
        qb.andWhere("worker.id = :workerId", { workerId: options.workerId });
      }
      if (options.pitakId) {
        qb.andWhere("pitak.id = :pitakId", { pitakId: options.pitakId });
      }
      if (options.sessionId) {
        qb.andWhere("session.id = :sessionId", {
          sessionId: options.sessionId,
        });
      }
      if (options.status) {
        qb.andWhere("assignment.status = :status", { status: options.status });
      }
      if (options.startDate) {
        qb.andWhere("assignment.assignmentDate >= :startDate", {
          startDate: options.startDate,
        });
      }
      if (options.endDate) {
        qb.andWhere("assignment.assignmentDate <= :endDate", {
          endDate: options.endDate,
        });
      }

      // Sorting
      const sortBy = options.sortBy || "assignmentDate";
      const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
      qb.orderBy(`assignment.${sortBy}`, sortOrder);

      // Pagination (if provided)
      if (options.page && options.limit) {
        const skip = (options.page - 1) * options.limit;
        qb.skip(skip).take(options.limit);
      } else if (options.limit) {
        // If only limit is provided (no page), apply limit only
        qb.take(options.limit);
      }

      const assignments = await qb.getMany();
      await auditLogger.logView("Assignment", null, "system");
      return assignments;
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
      throw error;
    }
  }
}

// Export singleton instance
const assignmentService = new AssignmentService();
module.exports = assignmentService;
