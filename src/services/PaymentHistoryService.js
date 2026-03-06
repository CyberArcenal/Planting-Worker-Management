// services/PaymentHistoryService.js

const auditLogger = require("../utils/auditLogger");

class PaymentHistoryService {
  constructor() {
    this.repository = null;
    this.paymentRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/datasource");
    const PaymentHistory = require("../entities/PaymentHistory");
    const Payment = require("../entities/Payment");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.repository = AppDataSource.getRepository(PaymentHistory);
    this.paymentRepository = AppDataSource.getRepository(Payment);
    console.log("PaymentHistoryService initialized");
  }

  async getRepositories() {
    if (!this.repository) {
      await this.initialize();
    }
    return {
      paymentHistory: this.repository,
      payment: this.paymentRepository,
    };
  }

  async create(data, user = "system") {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const { paymentHistory: repo, payment: paymentRepo } =
      await this.getRepositories();

    try {
      if (!data.paymentId) throw new Error("paymentId is required");

      const payment = await paymentRepo.findOne({
        where: { id: data.paymentId },
      });
      if (!payment)
        throw new Error(`Payment with ID ${data.paymentId} not found`);

      const historyData = {
        ...data,
        payment,
      };
      delete historyData.paymentId;

      const history = repo.create(historyData);
      const saved = await saveDb(repo, history);
      await auditLogger.logCreate("PaymentHistory", saved.id, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to create payment history:", error.message);
      throw error;
    }
  }

  async update(id, data, user = "system") {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const { paymentHistory: repo, payment: paymentRepo } =
      await this.getRepositories();

    try {
      const existing = await repo.findOne({
        where: { id },
        relations: ["payment"],
      });
      if (!existing) throw new Error(`PaymentHistory with ID ${id} not found`);

      const oldData = { ...existing };

      if (data.paymentId !== undefined) {
        const payment = await paymentRepo.findOne({
          where: { id: data.paymentId },
        });
        if (!payment)
          throw new Error(`Payment with ID ${data.paymentId} not found`);
        existing.payment = payment;
        delete data.paymentId;
      }

      Object.assign(existing, data);
      // No updatedAt field, just save
      const saved = await updateDb(repo, existing);
      await auditLogger.logUpdate("PaymentHistory", id, oldData, saved, user);
      return saved;
    } catch (error) {
      console.error("Failed to update payment history:", error.message);
      throw error;
    }
  }

  async delete(id, user = "system") {
    const { removeDb } = require("../utils/dbUtils/dbActions");
    const { paymentHistory: repo } = await this.getRepositories();

    try {
      const history = await repo.findOne({ where: { id } });
      if (!history) throw new Error(`PaymentHistory with ID ${id} not found`);

      const oldData = { ...history };
      await removeDb(repo, id);
      await auditLogger.logDelete("PaymentHistory", id, oldData, user);
      return { success: true };
    } catch (error) {
      console.error("Failed to delete payment history:", error.message);
      throw error;
    }
  }
  async findById(id) {
    const { paymentHistory: repo } = await this.getRepositories();

    try {
      const history = await repo
        .createQueryBuilder("history")
        .leftJoinAndSelect("history.payment", "payment")
        .leftJoinAndSelect("payment.worker", "worker")
        .leftJoinAndSelect("payment.pitak", "pitak")
        .leftJoinAndSelect("payment.session", "session")
        .where("history.id = :id", { id })
        .getOne();

      if (!history) throw new Error(`PaymentHistory with ID ${id} not found`);
      await auditLogger.logView("PaymentHistory", id, "system");
      return history;
    } catch (error) {
      console.error("Failed to find payment history:", error.message);
      throw error;
    }
  }

  async findAll(options = {}) {
    const { paymentHistory: repo } = await this.getRepositories();

    try {
      const qb = repo
        .createQueryBuilder("history")
        .leftJoinAndSelect("history.payment", "payment")
        .leftJoinAndSelect("payment.worker", "worker")
        .leftJoinAndSelect("payment.pitak", "pitak")
        .leftJoinAndSelect("payment.session", "session");

      if (options.paymentId) {
        qb.andWhere("payment.id = :paymentId", {
          paymentId: options.paymentId,
        });
      }
      if (options.actionType) {
        qb.andWhere("history.actionType = :actionType", {
          actionType: options.actionType,
        });
      }
      if (options.startDate) {
        qb.andWhere("history.changeDate >= :startDate", {
          startDate: options.startDate,
        });
      }
      if (options.endDate) {
        qb.andWhere("history.changeDate <= :endDate", {
          endDate: options.endDate,
        });
      }

      const sortBy = options.sortBy || "changeDate";
      const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
      qb.orderBy(`history.${sortBy}`, sortOrder);

      if (options.page && options.limit) {
        const skip = (options.page - 1) * options.limit;
        qb.skip(skip).take(options.limit);
      }

      const histories = await qb.getMany();
      await auditLogger.logView("PaymentHistory", null, "system");
      return histories;
    } catch (error) {
      console.error("Failed to fetch payment histories:", error);
      throw error;
    }
  }
}

const paymentHistoryService = new PaymentHistoryService();
module.exports = paymentHistoryService;
