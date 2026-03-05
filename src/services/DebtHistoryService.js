// services/DebtHistoryService.js
const auditLogger = require("../utils/auditLogger");

class DebtHistoryService {
  constructor() {
    this.repository = null;
    this.debtRepository = null;
    this.paymentRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/datasource");
    const DebtHistory = require("../entities/DebtHistory");
    const Debt = require("../entities/Debt");
    const Payment = require("../entities/Payment");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.repository = AppDataSource.getRepository(DebtHistory);
    this.debtRepository = AppDataSource.getRepository(Debt);
    this.paymentRepository = AppDataSource.getRepository(Payment);
    console.log("DebtHistoryService initialized");
  }

  async getRepositories() {
    if (!this.repository) {
      await this.initialize();
    }
    return {
      debtHistory: this.repository,
      debt: this.debtRepository,
      payment: this.paymentRepository,
    };
  }

  async create(data, user = "system") {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const {
      debtHistory: repo,
      debt: debtRepo,
      payment: paymentRepo,
    } = await this.getRepositories();

    try {
      if (!data.debtId) throw new Error("debtId is required");

      const debt = await debtRepo.findOne({ where: { id: data.debtId } });
      if (!debt) throw new Error(`Debt with ID ${data.debtId} not found`);

      let payment = null;
      if (data.paymentId) {
        payment = await paymentRepo.findOne({ where: { id: data.paymentId } });
        if (!payment)
          throw new Error(`Payment with ID ${data.paymentId} not found`);
      }

      const historyData = {
        ...data,
        debt,
        payment,
      };
      delete historyData.debtId;
      delete historyData.paymentId;

      const history = repo.create(historyData);
      const saved = await saveDb(repo, history);
      await auditLogger.logCreate("DebtHistory", saved.id, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to create debt history:", error.message);
      throw error;
    }
  }

  async update(id, data, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const {
      debtHistory: repo,
      debt: debtRepo,
      payment: paymentRepo,
    } = await this.getRepositories();

    try {
      const existing = await repo.findOne({
        where: { id },
        relations: ["debt", "payment"],
      });
      if (!existing) throw new Error(`DebtHistory with ID ${id} not found`);

      const oldData = { ...existing };

      if (data.debtId !== undefined) {
        const debt = await debtRepo.findOne({ where: { id: data.debtId } });
        if (!debt) throw new Error(`Debt with ID ${data.debtId} not found`);
        existing.debt = debt;
        delete data.debtId;
      }
      if (data.paymentId !== undefined) {
        if (data.paymentId === null) {
          existing.payment = null;
        } else {
          const payment = await paymentRepo.findOne({
            where: { id: data.paymentId },
          });
          if (!payment)
            throw new Error(`Payment with ID ${data.paymentId} not found`);
          existing.payment = payment;
        }
        delete data.paymentId;
      }

      Object.assign(existing, data);
      // DebtHistory has no updatedAt field, but we can use createdAt as immutable.
      // We'll just save.

      const saved = await updateDb(repo, existing);
      await auditLogger.logUpdate("DebtHistory", id, oldData, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to update debt history:", error.message);
      throw error;
    }
  }

  async delete(id, user = "system") {
    const { removeDb } = require("../utils/dbUtils/dbActions");
    const { debtHistory: repo } = await this.getRepositories();

    try {
      const history = await repo.findOne({ where: { id } });
      if (!history) throw new Error(`DebtHistory with ID ${id} not found`);

      const oldData = { ...history };
      await removeDb(repo, id);
      await auditLogger.logDelete("DebtHistory", id, oldData, user);
      return { success: true };
    } catch (error) {
      console.error("Failed to delete debt history:", error.message);
      throw error;
    }
  }

  async findById(id) {
    const { debtHistory: repo } = await this.getRepositories();

    try {
      const history = await repo.findOne({
        where: { id },
        relations: ["debt", "payment"],
      });
      if (!history) throw new Error(`DebtHistory with ID ${id} not found`);
      await auditLogger.logView("DebtHistory", id, "system");
      return history;
    } catch (error) {
      console.error("Failed to find debt history:", error.message);
      throw error;
    }
  }

  async findAll(options = {}) {
    const { debtHistory: repo } = await this.getRepositories();

    try {
      const qb = repo
        .createQueryBuilder("history")
        .leftJoinAndSelect("history.debt", "debt")
        .leftJoinAndSelect("history.payment", "payment");

      if (options.debtId) {
        qb.andWhere("debt.id = :debtId", { debtId: options.debtId });
      }
      if (options.paymentId) {
        qb.andWhere("payment.id = :paymentId", {
          paymentId: options.paymentId,
        });
      }
      if (options.transactionType) {
        qb.andWhere("history.transactionType = :transactionType", {
          transactionType: options.transactionType,
        });
      }
      if (options.startDate) {
        qb.andWhere("history.transactionDate >= :startDate", {
          startDate: options.startDate,
        });
      }
      if (options.endDate) {
        qb.andWhere("history.transactionDate <= :endDate", {
          endDate: options.endDate,
        });
      }

      const sortBy = options.sortBy || "transactionDate";
      const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
      qb.orderBy(`history.${sortBy}`, sortOrder);

      if (options.page && options.limit) {
        const skip = (options.page - 1) * options.limit;
        qb.skip(skip).take(options.limit);
      }

      const histories = await qb.getMany();
      await auditLogger.logView("DebtHistory", null, "system");
      return histories;
    } catch (error) {
      console.error("Failed to fetch debt histories:", error);
      throw error;
    }
  }
}

const debtHistoryService = new DebtHistoryService();
module.exports = debtHistoryService;
