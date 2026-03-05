// services/SessionService.js

const auditLogger = require("../utils/auditLogger");

class SessionService {
  constructor() {
    this.repository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/datasource");
    const Session = require("../entities/Session");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.repository = AppDataSource.getRepository(Session);
    console.log("SessionService initialized");
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
      if (!data.name) throw new Error("Session name is required");
      if (!data.year) throw new Error("year is required");
      if (!data.startDate) throw new Error("startDate is required");

      // Optional: check for duplicate name+year if desired
      // const existing = await repo.findOne({ where: { name: data.name, year: data.year } });
      // if (existing) throw new Error(`Session "${data.name}" for year ${data.year} already exists`);

      const session = repo.create({
        ...data,
        status: data.status || "active",
      });
      const saved = await saveDb(repo, session);
      await auditLogger.logCreate("Session", saved.id, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to create session:", error.message);
      throw error;
    }
  }

  async update(id, data, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const repo = await this.getRepository();

    try {
      const existing = await repo.findOne({ where: { id } });
      if (!existing) throw new Error(`Session with ID ${id} not found`);

      const oldData = { ...existing };

      // Optional uniqueness check
      // if (data.name && data.name !== existing.name) { ... }

      Object.assign(existing, data);
      existing.updatedAt = new Date();

      const saved = await updateDb(repo, existing);
      await auditLogger.logUpdate("Session", id, oldData, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to update session:", error.message);
      throw error;
    }
  }

  async updateStatus(id, newStatus, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const repo = await this.getRepository();

    const session = await repo.findOne({ where: { id } });
    if (!session) throw new Error(`Session with ID ${id} not found`);

    const oldStatus = session.status;
    if (oldStatus === newStatus) return session;

    // Allowed transitions: active → closed/archived, closed → archived, archived is final
    const allowedTransitions = {
      active: ["closed", "archived"],
      closed: ["archived"],
      archived: [],
    };

    if (!allowedTransitions[oldStatus]?.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${oldStatus} to ${newStatus}`,
      );
    }

    session.status = newStatus;
    session.updatedAt = new Date();

    const saved = await updateDb(repo, session);
    await auditLogger.logUpdate(
      "Session",
      id,
      { status: oldStatus },
      { status: newStatus },
      user,
    );
    return saved;
  }

  async delete(id, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const repo = await this.getRepository();

    try {
      const session = await repo.findOne({ where: { id } });
      if (!session) throw new Error(`Session with ID ${id} not found`);

      if (session.status === "archived") {
        return session;
      }

      const oldData = { ...session };
      session.status = "archived";
      session.updatedAt = new Date();

      const saved = await updateDb(repo, session);
      await auditLogger.logDelete("Session", id, oldData, user);
      return saved;
    } catch (error) {
      console.error("Failed to delete session:", error.message);
      throw error;
    }
  }

  async findById(id) {
    const repo = await this.getRepository();

    try {
      const session = await repo.findOne({
        where: { id },
        relations: ["bukids", "assignments", "payments", "debts"],
      });
      if (!session) throw new Error(`Session with ID ${id} not found`);
      await auditLogger.logView("Session", id, "system");
      return session;
    } catch (error) {
      console.error("Failed to find session:", error.message);
      throw error;
    }
  }

  async findAll(options = {}) {
    const repo = await this.getRepository();

    try {
      const qb = repo.createQueryBuilder("session");

      if (options.status) {
        qb.andWhere("session.status = :status", { status: options.status });
      }
      if (options.year) {
        qb.andWhere("session.year = :year", { year: options.year });
      }
      if (options.seasonType) {
        qb.andWhere("session.seasonType = :seasonType", {
          seasonType: options.seasonType,
        });
      }

      const sortBy = options.sortBy || "startDate";
      const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
      qb.orderBy(`session.${sortBy}`, sortOrder);

      if (options.page && options.limit) {
        const skip = (options.page - 1) * options.limit;
        qb.skip(skip).take(options.limit);
      }

      const sessions = await qb.getMany();
      await auditLogger.logView("Session", null, "system");
      return sessions;
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      throw error;
    }
  }
}

const sessionService = new SessionService();
module.exports = sessionService;
