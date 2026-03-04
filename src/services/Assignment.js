// services/AssignmentService.js
const auditLogger = require("../utils/auditLogger");
const { AssignmentStatus } = require("../entities/Assignment"); // we'll need to export the enum or define it here

class AssignmentService {
  constructor() {
    this.repository = null;
    this.workerRepository = null;
    this.pitakRepository = null;
    this.sessionRepository = null;
  }

  async initialize() {
  const { AppDataSource } = require("../main/db/dataSource");
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
   * Create a new assignment
   * @param {Object} data - { workerId, pitakId, sessionId, luwangCount, assignmentDate, notes? }
   * @param {string} user - user identifier for audit log
   */
  async create(data, user = "system") {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const { assignment: repo, worker: workerRepo, pitak: pitakRepo, session: sessionRepo } = await this.getRepositories();

    try {
      // Validate required fields
      if (!data.workerId) throw new Error("workerId is required");
      if (!data.pitakId) throw new Error("pitakId is required");
      if (!data.sessionId) throw new Error("sessionId is required");
      if (data.luwangCount === undefined) throw new Error("luwangCount is required");
      if (!data.assignmentDate) throw new Error("assignmentDate is required");

      // Fetch related entities
      const worker = await workerRepo.findOne({ where: { id: data.workerId } });
      if (!worker) throw new Error(`Worker with ID ${data.workerId} not found`);

      const pitak = await pitakRepo.findOne({ where: { id: data.pitakId } });
      if (!pitak) throw new Error(`Pitak with ID ${data.pitakId} not found`);

      const session = await sessionRepo.findOne({ where: { id: data.sessionId } });
      if (!session) throw new Error(`Session with ID ${data.sessionId} not found`);

      // Check uniqueness (worker + pitak + session) – the unique constraint will enforce at DB level,
      // but we check early to give a friendly error.
      const existing = await repo.findOne({
        where: {
          worker: { id: data.workerId },
          pitak: { id: data.pitakId },
          session: { id: data.sessionId },
        },
      });
      if (existing) {
        throw new Error("An assignment already exists for this worker, pitak, and session combination");
      }

      // Create entity
      const assignmentData = {
        ...data,
        worker,
        pitak,
        session,
        status: data.status || AssignmentStatus.ACTIVE,
      };
      delete assignmentData.workerId;
      delete assignmentData.pitakId;
      delete assignmentData.sessionId;

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
   * Update an existing assignment
   * @param {number} id
   * @param {Object} data - fields to update (luwangCount, notes, status, assignmentDate, etc.)
   * @param {string} user
   */
  async update(id, data, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const { assignment: repo, worker: workerRepo, pitak: pitakRepo, session: sessionRepo } = await this.getRepositories();

    try {
      const existing = await repo.findOne({
        where: { id },
        relations: ["worker", "pitak", "session"],
      });
      if (!existing) throw new Error(`Assignment with ID ${id} not found`);

      const oldData = { ...existing };

      // If worker, pitak, or session IDs are provided, fetch and update relations
      let worker = existing.worker;
      let pitak = existing.pitak;
      let session = existing.session;

      if (data.workerId !== undefined) {
        worker = await workerRepo.findOne({ where: { id: data.workerId } });
        if (!worker) throw new Error(`Worker with ID ${data.workerId} not found`);
        delete data.workerId;
      }
      if (data.pitakId !== undefined) {
        pitak = await pitakRepo.findOne({ where: { id: data.pitakId } });
        if (!pitak) throw new Error(`Pitak with ID ${data.pitakId} not found`);
        delete data.pitakId;
      }
      if (data.sessionId !== undefined) {
        session = await sessionRepo.findOne({ where: { id: data.sessionId } });
        if (!session) throw new Error(`Session with ID ${data.sessionId} not found`);
        delete data.sessionId;
      }

      // Check uniqueness if any of the three key fields changed
      if (
        worker.id !== existing.worker.id ||
        pitak.id !== existing.pitak.id ||
        session.id !== existing.session.id
      ) {
        const duplicate = await repo.findOne({
          where: {
            worker: { id: worker.id },
            pitak: { id: pitak.id },
            session: { id: session.id },
          },
        });
        if (duplicate && duplicate.id !== id) {
          throw new Error("Another assignment already exists for this worker, pitak, and session combination");
        }
      }

      // Update fields
      existing.worker = worker;
      existing.pitak = pitak;
      existing.session = session;
      Object.assign(existing, data);
      existing.updatedAt = new Date();

      const saved = await updateDb(repo, existing);
      await auditLogger.logUpdate("Assignment", id, oldData, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to update assignment:", error.message);
      throw error;
    }
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

      // If already cancelled, maybe just return or throw? We'll allow idempotent delete
      if (assignment.status === AssignmentStatus.CANCELLED) {
        return assignment; // no change
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
      await auditLogger.logView("Assignment", id, "system");
      return assignment;
    } catch (error) {
      console.error("Failed to find assignment:", error.message);
      throw error;
    }
  }

  /**
   * Find all assignments with optional filters
   * @param {Object} options - { workerId, pitakId, sessionId, status, startDate, endDate, page, limit, sortBy, sortOrder }
   */
  async findAll(options = {}) {
    const { assignment: repo } = await this.getRepositories();

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
        qb.andWhere("session.id = :sessionId", { sessionId: options.sessionId });
      }
      if (options.status) {
        qb.andWhere("assignment.status = :status", { status: options.status });
      }
      if (options.startDate) {
        qb.andWhere("assignment.assignmentDate >= :startDate", { startDate: options.startDate });
      }
      if (options.endDate) {
        qb.andWhere("assignment.assignmentDate <= :endDate", { endDate: options.endDate });
      }

      // Sorting
      const sortBy = options.sortBy || "assignmentDate";
      const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
      qb.orderBy(`assignment.${sortBy}`, sortOrder);

      // Pagination
      if (options.page && options.limit) {
        const skip = (options.page - 1) * options.limit;
        qb.skip(skip).take(options.limit);
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