// services/WorkerService.js


const auditLogger = require("../utils/auditLogger");

class WorkerService {
  constructor() {
    this.repository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/dataSource");
    const Worker = require("../entities/Worker");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.repository = AppDataSource.getRepository(Worker);
    console.log("WorkerService initialized");
  }

  async getRepository() {
    if (!this.repository) {
      await this.initialize();
    }
    return this.repository;
  }

  async create(data, user = "system") {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const repo = await this.getRepository();

    try {
      if (!data.name) throw new Error("Worker name is required");

      // Email uniqueness
      if (data.email) {
        const existing = await repo.findOne({ where: { email: data.email } });
        if (existing) throw new Error(`Worker with email "${data.email}" already exists`);
      }

      const worker = repo.create({
        ...data,
        status: data.status || "active",
      });
      const saved = await saveDb(repo, worker);
      await auditLogger.logCreate("Worker", saved.id, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to create worker:", error.message);
      throw error;
    }
  }

  async update(id, data, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const repo = await this.getRepository();

    try {
      const existing = await repo.findOne({ where: { id } });
      if (!existing) throw new Error(`Worker with ID ${id} not found`);

      const oldData = { ...existing };

      // Email uniqueness if changed
      if (data.email && data.email !== existing.email) {
        const emailExists = await repo.findOne({ where: { email: data.email } });
        if (emailExists) throw new Error(`Worker with email "${data.email}" already exists`);
      }

      Object.assign(existing, data);
      existing.updatedAt = new Date();

      const saved = await updateDb(repo, existing);
      await auditLogger.logUpdate("Worker", id, oldData, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to update worker:", error.message);
      throw error;
    }
  }

  async delete(id, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const repo = await this.getRepository();

    try {
      const worker = await repo.findOne({ where: { id } });
      if (!worker) throw new Error(`Worker with ID ${id} not found`);

      if (worker.status === "terminated") {
        return worker;
      }

      const oldData = { ...worker };
      worker.status = "terminated";
      worker.updatedAt = new Date();

      const saved = await updateDb(repo, worker);
      await auditLogger.logDelete("Worker", id, oldData, user);
      return saved;
    } catch (error) {
      console.error("Failed to delete worker:", error.message);
      throw error;
    }
  }

  async findById(id) {
    const repo = await this.getRepository();

    try {
      const worker = await repo.findOne({
        where: { id },
        relations: ["debts", "payments", "assignments"],
      });
      if (!worker) throw new Error(`Worker with ID ${id} not found`);
      await auditLogger.logView("Worker", id, "system");
      return worker;
    } catch (error) {
      console.error("Failed to find worker:", error.message);
      throw error;
    }
  }

  async findAll(options = {}) {
    const repo = await this.getRepository();

    try {
      const qb = repo.createQueryBuilder("worker");

      if (options.status) {
        qb.andWhere("worker.status = :status", { status: options.status });
      }
      if (options.search) {
        qb.andWhere("(worker.name LIKE :search OR worker.email LIKE :search OR worker.contact LIKE :search)", {
          search: `%${options.search}%`,
        });
      }

      const sortBy = options.sortBy || "createdAt";
      const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
      qb.orderBy(`worker.${sortBy}`, sortOrder);

      if (options.page && options.limit) {
        const skip = (options.page - 1) * options.limit;
        qb.skip(skip).take(options.limit);
      }

      const workers = await qb.getMany();
      await auditLogger.logView("Worker", null, "system");
      return workers;
    } catch (error) {
      console.error("Failed to fetch workers:", error);
      throw error;
    }
  }
}

const workerService = new WorkerService();
module.exports = workerService;