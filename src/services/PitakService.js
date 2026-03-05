// services/PitakService.js

const auditLogger = require("../utils/auditLogger");

class PitakService {
  constructor() {
    this.repository = null;
    this.bukidRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/datasource");
    const Pitak = require("../entities/Pitak");
    const Bukid = require("../entities/Bukid");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.repository = AppDataSource.getRepository(Pitak);
    this.bukidRepository = AppDataSource.getRepository(Bukid);
    console.log("PitakService initialized");
  }

  async getRepositories() {
    if (!this.repository) {
      await this.initialize();
    }
    return {
      pitak: this.repository,
      bukid: this.bukidRepository,
    };
  }

  /**
   * Create a new pitak. If location is not provided, auto-generate a unique name like "Plot-1", "Plot-2", etc.
   */
  async create(data, user = "system") {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const { pitak: repo, bukid: bukidRepo } = await this.getRepositories();

    try {
      if (!data.bukidId) throw new Error("bukidId is required");

      const bukid = await bukidRepo.findOne({ where: { id: data.bukidId } });
      if (!bukid) throw new Error(`Bukid with ID ${data.bukidId} not found`);

      // Auto-generate location if not provided
      if (!data.location || data.location.trim() === "") {
        const count = await repo.count({
          where: { bukid: { id: data.bukidId } },
        });
        data.location = `Plot-${count + 1}`;
      }

      // Check uniqueness of (bukid, location)
      const existing = await repo.findOne({
        where: {
          bukid: { id: data.bukidId },
          location: data.location,
        },
      });
      if (existing) {
        throw new Error(
          `A pitak with location "${data.location}" already exists in this bukid`,
        );
      }

      const pitakData = {
        ...data,
        bukid,
        status: data.status || "active",
      };
      delete pitakData.bukidId;

      const pitak = repo.create(pitakData);
      const saved = await saveDb(repo, pitak);
      await auditLogger.logCreate("Pitak", saved.id, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to create pitak:", error.message);
      throw error;
    }
  }

  async update(id, data, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const { pitak: repo, bukid: bukidRepo } = await this.getRepositories();

    try {
      const existing = await repo.findOne({
        where: { id },
        relations: ["bukid"],
      });
      if (!existing) throw new Error(`Pitak with ID ${id} not found`);

      const oldData = { ...existing };

      if (data.bukidId !== undefined) {
        const bukid = await bukidRepo.findOne({ where: { id: data.bukidId } });
        if (!bukid) throw new Error(`Bukid with ID ${data.bukidId} not found`);
        existing.bukid = bukid;
        delete data.bukidId;
      }

      // If location or bukid changed, check uniqueness
      if (
        (data.location !== undefined && data.location !== existing.location) ||
        data.bukidId !== undefined
      ) {
        const duplicate = await repo.findOne({
          where: {
            bukid: { id: existing.bukid.id },
            location: data.location || existing.location,
          },
        });
        if (duplicate && duplicate.id !== id) {
          throw new Error(
            `A pitak with location "${data.location || existing.location}" already exists in this bukid`,
          );
        }
      }

      Object.assign(existing, data);
      existing.updatedAt = new Date();

      const saved = await updateDb(repo, existing);
      await auditLogger.logUpdate("Pitak", id, oldData, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to update pitak:", error.message);
      throw error;
    }
  }

  async updateStatus(id, newStatus, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const { pitak: repo } = await this.getRepositories();

    const pitak = await repo.findOne({ where: { id } });
    if (!pitak) throw new Error(`Pitak with ID ${id} not found`);

    const oldStatus = pitak.status;
    if (oldStatus === newStatus) return pitak;

    // Allowed transitions: active ↔ inactive, and both can go to archived (final)
    const allowedTransitions = {
      active: ["inactive", "archived"],
      inactive: ["active", "archived"],
      archived: [],
    };

    if (!allowedTransitions[oldStatus]?.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${oldStatus} to ${newStatus}`,
      );
    }

    pitak.status = newStatus;
    pitak.updatedAt = new Date();

    const saved = await updateDb(repo, pitak);
    await auditLogger.logUpdate(
      "Pitak",
      id,
      { status: oldStatus },
      { status: newStatus },
      user,
    );
    return saved;
  }

  async delete(id, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const { pitak: repo } = await this.getRepositories();

    try {
      const pitak = await repo.findOne({ where: { id } });
      if (!pitak) throw new Error(`Pitak with ID ${id} not found`);

      if (pitak.status === "archived") {
        return pitak;
      }

      const oldData = { ...pitak };
      pitak.status = "archived";
      pitak.updatedAt = new Date();

      const saved = await updateDb(repo, pitak);
      await auditLogger.logDelete("Pitak", id, oldData, user);
      return saved;
    } catch (error) {
      console.error("Failed to delete pitak:", error.message);
      throw error;
    }
  }

  async findById(id) {
    const { pitak: repo } = await this.getRepositories();

    try {
      const pitak = await repo.findOne({
        where: { id },
        relations: ["bukid", "assignments", "payments"],
      });
      if (!pitak) throw new Error(`Pitak with ID ${id} not found`);
      await auditLogger.logView("Pitak", id, "system");
      return pitak;
    } catch (error) {
      console.error("Failed to find pitak:", error.message);
      throw error;
    }
  }

  async findAll(options = {}) {
    const { pitak: repo } = await this.getRepositories();

    try {
      const qb = repo
        .createQueryBuilder("pitak")
        .leftJoinAndSelect("pitak.bukid", "bukid");

      if (options.bukidId) {
        qb.andWhere("bukid.id = :bukidId", { bukidId: options.bukidId });
      }
      if (options.status) {
        qb.andWhere("pitak.status = :status", { status: options.status });
      }
      if (options.search) {
        qb.andWhere("(pitak.location LIKE :search)", {
          search: `%${options.search}%`,
        });
      }

      const sortBy = options.sortBy || "createdAt";
      const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
      qb.orderBy(`pitak.${sortBy}`, sortOrder);

      if (options.page && options.limit) {
        const skip = (options.page - 1) * options.limit;
        qb.skip(skip).take(options.limit);
      }

      const pitaks = await qb.getMany();
      await auditLogger.logView("Pitak", null, "system");
      return pitaks;
    } catch (error) {
      console.error("Failed to fetch pitaks:", error);
      throw error;
    }
  }
}

const pitakService = new PitakService();
module.exports = pitakService;