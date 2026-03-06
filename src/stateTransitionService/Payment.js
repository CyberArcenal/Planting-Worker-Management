// src/stateTransitionServices/PaymentStateTransitionService.js
// @ts-check
const auditLogger = require("../utils/auditLogger");
const { logger } = require("../utils/logger");
const PaymentHistory = require("../entities/PaymentHistory");
const { saveDb } = require("../utils/dbUtils/dbActions");
const { AppDataSource } = require("../main/db/datasource");

class PaymentStateTransitionService {
  // @ts-ignore
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  // @ts-ignore
  async onCompleted(payment, oldPayment, user = "system") {
    logger.info(`[PaymentTransition] Payment #${payment.id} completed, old status: ${oldPayment?.status}`);
    await this._logHistory(payment, oldPayment, "completed", user);
    // placeholder: could reduce worker's debts
  }

  // @ts-ignore
  async onCancelled(payment, oldPayment, user = "system") {
    logger.info(`[PaymentTransition] Payment #${payment.id} cancelled, old status: ${oldPayment?.status}`);
    await this._logHistory(payment, oldPayment, "cancelled", user);
  }

  // @ts-ignore
  async onPartiallyPaid(payment, oldPayment, user = "system") {
    logger.info(`[PaymentTransition] Payment #${payment.id} partially paid, old status: ${oldPayment?.status}`);
    await this._logHistory(payment, oldPayment, "partially_paid", user);
  }

  // --- Private helpers ---

  // @ts-ignore
  async _logHistory(payment, oldPayment, actionType, user) {
    const historyRepo = AppDataSource.getRepository(PaymentHistory);

    // Determine which field changed (status)
    const changedField = "status";
    const oldValue = oldPayment?.status || null;
    const newValue = payment.status;

    // For financial changes, we could also track amount changes, but status change may not affect amounts.
    // If needed, we can add oldAmount/newAmount later.

    const history = historyRepo.create({
      // @ts-ignore
      payment: payment,
      actionType, // e.g., "processing", "completed"
      changedField,
      oldValue,
      newValue,
      oldAmount: null, // no amount change
      newAmount: null,
      notes: `Status changed from ${oldValue} to ${newValue}`,
      performedBy: user,
      referenceNumber: payment.referenceNumber,
    });

    // @ts-ignore
    await saveDb(historyRepo, history);
    // @ts-ignore
    await auditLogger.logCreate("PaymentHistory", history.id, history, user);
    logger.info(`[PaymentTransition] PaymentHistory #${history.id} created for payment #${payment.id}`);
  }
}

module.exports = { PaymentStateTransitionService };