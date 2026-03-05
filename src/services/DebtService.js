// services/DebtService.js

const auditLogger = require("../utils/auditLogger");

class DebtService {
  constructor() {
    this.repository = null;
    this.workerRepository = null;
    this.sessionRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/datasource");
    const Debt = require("../entities/Debt");
    const Worker = require("../entities/Worker");
    const Session = require("../entities/Session");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.repository = AppDataSource.getRepository(Debt);
    this.workerRepository = AppDataSource.getRepository(Worker);
    this.sessionRepository = AppDataSource.getRepository(Session);
    console.log("DebtService initialized");
  }

  async getRepositories() {
    if (!this.repository) {
      await this.initialize();
    }
    return {
      debt: this.repository,
      worker: this.workerRepository,
      session: this.sessionRepository,
    };
  }

  async create(data, user = "system") {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const {
      debt: repo,
      worker: workerRepo,
      session: sessionRepo,
    } = await this.getRepositories();

    try {
      if (!data.workerId) throw new Error("workerId is required");
      if (!data.sessionId) throw new Error("sessionId is required");
      if (data.amount === undefined) throw new Error("amount is required");

      const worker = await workerRepo.findOne({ where: { id: data.workerId } });
      if (!worker) throw new Error(`Worker with ID ${data.workerId} not found`);

      const session = await sessionRepo.findOne({
        where: { id: data.sessionId },
      });
      if (!session)
        throw new Error(`Session with ID ${data.sessionId} not found`);

      const debtData = {
        ...data,
        worker,
        session,
        originalAmount: data.originalAmount || data.amount,
        balance: data.balance || data.amount,
        status: data.status || "pending",
      };
      delete debtData.workerId;
      delete debtData.sessionId;

      const debt = repo.create(debtData);
      const saved = await saveDb(repo, debt);
      await auditLogger.logCreate("Debt", saved.id, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to create debt:", error.message);
      throw error;
    }
  }

  async update(id, data, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const {
      debt: repo,
      worker: workerRepo,
      session: sessionRepo,
    } = await this.getRepositories();

    try {
      const existing = await repo.findOne({
        where: { id },
        relations: ["worker", "session"],
      });
      if (!existing) throw new Error(`Debt with ID ${id} not found`);

      const oldData = { ...existing };

      if (data.workerId !== undefined) {
        const worker = await workerRepo.findOne({
          where: { id: data.workerId },
        });
        if (!worker)
          throw new Error(`Worker with ID ${data.workerId} not found`);
        existing.worker = worker;
        delete data.workerId;
      }
      if (data.sessionId !== undefined) {
        const session = await sessionRepo.findOne({
          where: { id: data.sessionId },
        });
        if (!session)
          throw new Error(`Session with ID ${data.sessionId} not found`);
        existing.session = session;
        delete data.sessionId;
      }

      // If amount changes, update balance accordingly (or allow manual balance update)
      // Usually balance is managed via DebtHistory, but we keep it simple here.
      Object.assign(existing, data);
      existing.updatedAt = new Date();

      const saved = await updateDb(repo, existing);
      await auditLogger.logUpdate("Debt", id, oldData, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to update debt:", error.message);
      throw error;
    }
  }

  async updateStatus(id, newStatus, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const { debt: repo } = await this.getRepositories();

    const debt = await repo.findOne({ where: { id } });
    if (!debt) throw new Error(`Debt with ID ${id} not found`);

    const oldStatus = debt.status;
    if (oldStatus === newStatus) return debt;

    // Allowed transitions for debt statuses
    const allowedTransitions = {
      pending: ["partially_paid", "paid", "cancelled", "overdue", "settled"],
      partially_paid: ["paid", "cancelled", "overdue", "settled"],
      overdue: ["paid", "settled", "cancelled"],
      paid: ["settled"],
      settled: [],
      cancelled: [],
    };

    if (!allowedTransitions[oldStatus]?.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${oldStatus} to ${newStatus}`,
      );
    }

    debt.status = newStatus;
    debt.updatedAt = new Date();

    const saved = await updateDb(repo, debt);
    await auditLogger.logUpdate(
      "Debt",
      id,
      { status: oldStatus },
      { status: newStatus },
      user,
    );
    return saved;
  }

  async delete(id, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const { debt: repo } = await this.getRepositories();

    try {
      const debt = await repo.findOne({ where: { id } });
      if (!debt) throw new Error(`Debt with ID ${id} not found`);

      if (debt.status === "cancelled") {
        return debt;
      }

      const oldData = { ...debt };
      debt.status = "cancelled";
      debt.updatedAt = new Date();

      const saved = await updateDb(repo, debt);
      await auditLogger.logDelete("Debt", id, oldData, user);
      return saved;
    } catch (error) {
      console.error("Failed to delete debt:", error.message);
      throw error;
    }
  }

  async findById(id) {
    const { debt: repo } = await this.getRepositories();

    try {
      const debt = await repo.findOne({
        where: { id },
        relations: ["worker", "session", "history"],
      });
      if (!debt) throw new Error(`Debt with ID ${id} not found`);
      await auditLogger.logView("Debt", id, "system");
      return debt;
    } catch (error) {
      console.error("Failed to find debt:", error.message);
      throw error;
    }
  }

  async findAll(options = {}) {
    const { debt: repo } = await this.getRepositories();

    try {
      const qb = repo
        .createQueryBuilder("debt")
        .leftJoinAndSelect("debt.worker", "worker")
        .leftJoinAndSelect("debt.session", "session");

      if (options.workerId) {
        qb.andWhere("worker.id = :workerId", { workerId: options.workerId });
      }
      if (options.sessionId) {
        qb.andWhere("session.id = :sessionId", {
          sessionId: options.sessionId,
        });
      }
      if (options.status) {
        qb.andWhere("debt.status = :status", { status: options.status });
      }
      if (options.dueDateStart) {
        qb.andWhere("debt.dueDate >= :dueDateStart", {
          dueDateStart: options.dueDateStart,
        });
      }
      if (options.dueDateEnd) {
        qb.andWhere("debt.dueDate <= :dueDateEnd", {
          dueDateEnd: options.dueDateEnd,
        });
      }

      const sortBy = options.sortBy || "createdAt";
      const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
      qb.orderBy(`debt.${sortBy}`, sortOrder);

      if (options.page && options.limit) {
        const skip = (options.page - 1) * options.limit;
        qb.skip(skip).take(options.limit);
      }

      const debts = await qb.getMany();
      await auditLogger.logView("Debt", null, "system");
      return debts;
    } catch (error) {
      console.error("Failed to fetch debts:", error);
      throw error;
    }
  }
}

const debtService = new DebtService();
module.exports = debtService;
