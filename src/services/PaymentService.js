// services/PaymentService.js

const auditLogger = require("../utils/auditLogger");

class PaymentService {
  constructor() {
    this.repository = null;
    this.workerRepository = null;
    this.pitakRepository = null;
    this.sessionRepository = null;
    this.assignmentRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/dataSource");
    const Payment = require("../entities/Payment");
    const Worker = require("../entities/Worker");
    const Pitak = require("../entities/Pitak");
    const Session = require("../entities/Session");
    const Assignment = require("../entities/Assignment");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.repository = AppDataSource.getRepository(Payment);
    this.workerRepository = AppDataSource.getRepository(Worker);
    this.pitakRepository = AppDataSource.getRepository(Pitak);
    this.sessionRepository = AppDataSource.getRepository(Session);
    this.assignmentRepository = AppDataSource.getRepository(Assignment);
    console.log("PaymentService initialized");
  }

  async getRepositories() {
    if (!this.repository) {
      await this.initialize();
    }
    return {
      payment: this.repository,
      worker: this.workerRepository,
      pitak: this.pitakRepository,
      session: this.sessionRepository,
      assignment: this.assignmentRepository,
    };
  }

  async create(data, user = "system") {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const { payment: repo, worker: workerRepo, pitak: pitakRepo, session: sessionRepo, assignment: assignmentRepo } = await this.getRepositories();

    try {
      if (!data.workerId) throw new Error("workerId is required");
      if (!data.pitakId) throw new Error("pitakId is required");
      if (!data.sessionId) throw new Error("sessionId is required");

      const worker = await workerRepo.findOne({ where: { id: data.workerId } });
      if (!worker) throw new Error(`Worker with ID ${data.workerId} not found`);

      const pitak = await pitakRepo.findOne({ where: { id: data.pitakId } });
      if (!pitak) throw new Error(`Pitak with ID ${data.pitakId} not found`);

      const session = await sessionRepo.findOne({ where: { id: data.sessionId } });
      if (!session) throw new Error(`Session with ID ${data.sessionId} not found`);

      let assignment = null;
      if (data.assignmentId) {
        assignment = await assignmentRepo.findOne({ where: { id: data.assignmentId } });
        if (!assignment) throw new Error(`Assignment with ID ${data.assignmentId} not found`);
      }

      // Check uniqueness of (pitak, worker, session)
      const existing = await repo.findOne({
        where: {
          worker: { id: data.workerId },
          pitak: { id: data.pitakId },
          session: { id: data.sessionId },
        },
      });
      if (existing) {
        throw new Error("A payment already exists for this worker, pitak, and session combination");
      }

      // If assignmentId provided, check its uniqueness
      if (data.assignmentId) {
        const existingByAssignment = await repo.findOne({
          where: { assignment: { id: data.assignmentId } },
        });
        if (existingByAssignment) {
          throw new Error(`Assignment ID ${data.assignmentId} is already linked to another payment`);
        }
      }

      // Idempotency key uniqueness
      if (data.idempotencyKey) {
        const existingKey = await repo.findOne({ where: { idempotencyKey: data.idempotencyKey } });
        if (existingKey) {
          throw new Error(`Idempotency key "${data.idempotencyKey}" already exists`);
        }
      }

      const paymentData = {
        ...data,
        worker,
        pitak,
        session,
        assignment,
        status: data.status || "pending",
      };
      delete paymentData.workerId;
      delete paymentData.pitakId;
      delete paymentData.sessionId;
      delete paymentData.assignmentId;

      const payment = repo.create(paymentData);
      const saved = await saveDb(repo, payment);
      await auditLogger.logCreate("Payment", saved.id, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to create payment:", error.message);
      throw error;
    }
  }

  async update(id, data, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const { payment: repo, worker: workerRepo, pitak: pitakRepo, session: sessionRepo, assignment: assignmentRepo } = await this.getRepositories();

    try {
      const existing = await repo.findOne({
        where: { id },
        relations: ["worker", "pitak", "session", "assignment"],
      });
      if (!existing) throw new Error(`Payment with ID ${id} not found`);

      const oldData = { ...existing };

      // Handle relation changes
      if (data.workerId !== undefined) {
        const worker = await workerRepo.findOne({ where: { id: data.workerId } });
        if (!worker) throw new Error(`Worker with ID ${data.workerId} not found`);
        existing.worker = worker;
        delete data.workerId;
      }
      if (data.pitakId !== undefined) {
        const pitak = await pitakRepo.findOne({ where: { id: data.pitakId } });
        if (!pitak) throw new Error(`Pitak with ID ${data.pitakId} not found`);
        existing.pitak = pitak;
        delete data.pitakId;
      }
      if (data.sessionId !== undefined) {
        const session = await sessionRepo.findOne({ where: { id: data.sessionId } });
        if (!session) throw new Error(`Session with ID ${data.sessionId} not found`);
        existing.session = session;
        delete data.sessionId;
      }
      if (data.assignmentId !== undefined) {
        if (data.assignmentId === null) {
          existing.assignment = null;
        } else {
          const assignment = await assignmentRepo.findOne({ where: { id: data.assignmentId } });
          if (!assignment) throw new Error(`Assignment with ID ${data.assignmentId} not found`);
          existing.assignment = assignment;
        }
        delete data.assignmentId;
      }

      // Check uniqueness constraints if relevant keys changed
      if (
        (data.workerId !== undefined || data.pitakId !== undefined || data.sessionId !== undefined) &&
        existing.worker && existing.pitak && existing.session
      ) {
        const duplicate = await repo.findOne({
          where: {
            worker: { id: existing.worker.id },
            pitak: { id: existing.pitak.id },
            session: { id: existing.session.id },
          },
        });
        if (duplicate && duplicate.id !== id) {
          throw new Error("Another payment already exists for this worker, pitak, and session combination");
        }
      }

      // If assignment changed, check its uniqueness
      if (data.assignmentId !== undefined && existing.assignment) {
        const duplicateAssignment = await repo.findOne({
          where: { assignment: { id: existing.assignment.id } },
        });
        if (duplicateAssignment && duplicateAssignment.id !== id) {
          throw new Error(`Assignment ID ${existing.assignment.id} is already linked to another payment`);
        }
      }

      // Idempotency key uniqueness if changed
      if (data.idempotencyKey && data.idempotencyKey !== existing.idempotencyKey) {
        const keyExists = await repo.findOne({ where: { idempotencyKey: data.idempotencyKey } });
        if (keyExists) {
          throw new Error(`Idempotency key "${data.idempotencyKey}" already exists`);
        }
      }

      Object.assign(existing, data);
      existing.updatedAt = new Date();

      const saved = await updateDb(repo, existing);
      await auditLogger.logUpdate("Payment", id, oldData, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to update payment:", error.message);
      throw error;
    }
  }

  async delete(id, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const { payment: repo } = await this.getRepositories();

    try {
      const payment = await repo.findOne({ where: { id } });
      if (!payment) throw new Error(`Payment with ID ${id} not found`);

      if (payment.status === "cancel") {
        return payment;
      }

      const oldData = { ...payment };
      payment.status = "cancel";
      payment.updatedAt = new Date();

      const saved = await updateDb(repo, payment);
      await auditLogger.logDelete("Payment", id, oldData, user);
      return saved;
    } catch (error) {
      console.error("Failed to delete payment:", error.message);
      throw error;
    }
  }

  async findById(id) {
    const { payment: repo } = await this.getRepositories();

    try {
      const payment = await repo.findOne({
        where: { id },
        relations: ["worker", "pitak", "session", "assignment", "history", "debtPayments"],
      });
      if (!payment) throw new Error(`Payment with ID ${id} not found`);
      await auditLogger.logView("Payment", id, "system");
      return payment;
    } catch (error) {
      console.error("Failed to find payment:", error.message);
      throw error;
    }
  }

  async findAll(options = {}) {
    const { payment: repo } = await this.getRepositories();

    try {
      const qb = repo
        .createQueryBuilder("payment")
        .leftJoinAndSelect("payment.worker", "worker")
        .leftJoinAndSelect("payment.pitak", "pitak")
        .leftJoinAndSelect("payment.session", "session")
        .leftJoinAndSelect("payment.assignment", "assignment");

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
        qb.andWhere("payment.status = :status", { status: options.status });
      }
      if (options.startDate) {
        qb.andWhere("payment.paymentDate >= :startDate", { startDate: options.startDate });
      }
      if (options.endDate) {
        qb.andWhere("payment.paymentDate <= :endDate", { endDate: options.endDate });
      }

      const sortBy = options.sortBy || "createdAt";
      const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
      qb.orderBy(`payment.${sortBy}`, sortOrder);

      if (options.page && options.limit) {
        const skip = (options.page - 1) * options.limit;
        qb.skip(skip).take(options.limit);
      }

      const payments = await qb.getMany();
      await auditLogger.logView("Payment", null, "system");
      return payments;
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      throw error;
    }
  }
}

const paymentService = new PaymentService();
module.exports = paymentService;