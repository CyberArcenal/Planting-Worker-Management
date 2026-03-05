// services/BukidService.js
const auditLogger = require("../utils/auditLogger");

class BukidService {
  constructor() {
    this.repository = null;
    this.sessionRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/datasource");
    const Bukid = require("../entities/Bukid");
    const Session = require("../entities/Session");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.repository = AppDataSource.getRepository(Bukid);
    this.sessionRepository = AppDataSource.getRepository(Session);
    console.log("BukidService initialized");
  }

  async getRepositories() {
    if (!this.repository) {
      await this.initialize();
    }
    return {
      bukid: this.repository,
      session: this.sessionRepository,
    };
  }

  async create(data, user = "system") {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const { bukid: repo, session: sessionRepo } = await this.getRepositories();

    try {
      if (!data.name) throw new Error("Bukid name is required");
      if (!data.sessionId) throw new Error("sessionId is required");

      const session = await sessionRepo.findOne({
        where: { id: data.sessionId },
      });
      if (!session)
        throw new Error(`Session with ID ${data.sessionId} not found`);

      const bukidData = {
        ...data,
        session,
        status: data.status || "active",
      };
      delete bukidData.sessionId;

      const bukid = repo.create(bukidData);
      const saved = await saveDb(repo, bukid);
      await auditLogger.logCreate("Bukid", saved.id, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to create bukid:", error.message);
      throw error;
    }
  }

  async update(id, data, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const { bukid: repo, session: sessionRepo } = await this.getRepositories();

    try {
      const existing = await repo.findOne({
        where: { id },
        relations: ["session"],
      });
      if (!existing) throw new Error(`Bukid with ID ${id} not found`);

      const oldData = { ...existing };

      if (data.sessionId !== undefined) {
        const session = await sessionRepo.findOne({
          where: { id: data.sessionId },
        });
        if (!session)
          throw new Error(`Session with ID ${data.sessionId} not found`);
        existing.session = session;
        delete data.sessionId;
      }

      Object.assign(existing, data);
      existing.updatedAt = new Date();

      const saved = await updateDb(repo, existing);
      await auditLogger.logUpdate("Bukid", id, oldData, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to update bukid:", error.message);
      throw error;
    }
  }

  async updateStatus(id, newStatus, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const { bukid: repo } = await this.getRepositories();

    const bukid = await repo.findOne({ where: { id } });
    if (!bukid) throw new Error(`Bukid with ID ${id} not found`);

    const oldStatus = bukid.status;
    if (oldStatus === newStatus) return bukid;

    // Allowed transitions: initiated → active/complete/inactive, active → complete/inactive,
    // inactive → active, complete is final
    const allowedTransitions = {
      initiated: ["active", "complete", "inactive"],
      active: ["complete", "inactive"],
      complete: [],
      inactive: ["active"],
    };

    if (!allowedTransitions[oldStatus]?.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${oldStatus} to ${newStatus}`,
      );
    }

    bukid.status = newStatus;
    bukid.updatedAt = new Date();

    const saved = await updateDb(repo, bukid);
    await auditLogger.logUpdate(
      "Bukid",
      id,
      { status: oldStatus },
      { status: newStatus },
      user,
    );
    return saved;
  }

  async delete(id, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const { bukid: repo } = await this.getRepositories();

    try {
      const bukid = await repo.findOne({ where: { id } });
      if (!bukid) throw new Error(`Bukid with ID ${id} not found`);

      if (bukid.status === "archived") {
        return bukid; // already archived
      }

      const oldData = { ...bukid };
      bukid.status = "archived";
      bukid.updatedAt = new Date();

      const saved = await updateDb(repo, bukid);
      await auditLogger.logDelete("Bukid", id, oldData, user);
      return saved;
    } catch (error) {
      console.error("Failed to delete bukid:", error.message);
      throw error;
    }
  }

  async findById(id) {
    const { bukid: repo } = await this.getRepositories();

    try {
      const bukid = await repo.findOne({
        where: { id },
        relations: ["session", "pitaks"],
      });
      if (!bukid) throw new Error(`Bukid with ID ${id} not found`);
      await auditLogger.logView("Bukid", id, "system");
      return bukid;
    } catch (error) {
      console.error("Failed to find bukid:", error.message);
      throw error;
    }
  }

  async findAll(options = {}) {
    const { bukid: repo } = await this.getRepositories();

    try {
      const qb = repo
        .createQueryBuilder("bukid")
        .leftJoinAndSelect("bukid.session", "session")
        .leftJoinAndSelect("bukid.pitaks", "pitaks");

      if (options.sessionId) {
        qb.andWhere("session.id = :sessionId", {
          sessionId: options.sessionId,
        });
      }
      if (options.status) {
        qb.andWhere("bukid.status = :status", { status: options.status });
      }
      if (options.search) {
        qb.andWhere(
          "(bukid.name LIKE :search OR bukid.location LIKE :search)",
          {
            search: `%${options.search}%`,
          },
        );
      }

      const sortBy = options.sortBy || "createdAt";
      const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
      qb.orderBy(`bukid.${sortBy}`, sortOrder);

      if (options.page && options.limit) {
        const skip = (options.page - 1) * options.limit;
        qb.skip(skip).take(options.limit);
      }

      const bukids = await qb.getMany();
      await auditLogger.logView("Bukid", null, "system");
      return bukids;
    } catch (error) {
      console.error("Failed to fetch bukids:", error);
      throw error;
    }
  }
}

const bukidService = new BukidService();
module.exports = bukidService;
