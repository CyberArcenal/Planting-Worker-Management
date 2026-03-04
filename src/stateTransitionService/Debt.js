// src/stateTransitionServices/DebtStateTransitionService.js
// @ts-check
const auditLogger = require("../utils/auditLogger");
const { logger } = require("../utils/logger");
const notificationService = require("../services/Notification");
const emailSender = require("../channels/email.sender");
const smsSender = require("../channels/sms.sender");
const { companyName } = require("../utils/settings/system");
const DebtHistory = require("../entities/DebtHistory");
const { saveDb } = require("../utils/dbUtils/dbActions"); // ✅ use saveDb

class DebtStateTransitionService {
  // @ts-ignore
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Called when a debt is marked as paid.
   */
  // @ts-ignore
  async onPaid(debt, manager, oldDebt, user = "system") {
    logger.info(`[DebtTransition] Debt #${debt.id} paid, old status: ${oldDebt?.status}`);

    // 1. Log to DebtHistory
    await this._logHistory(debt, manager, oldDebt, "paid", user);

    // 2. Notify worker
    await this._notifyWorker(debt, "paid");
  }

  /**
   * Called when a debt is marked as partially paid.
   */
  // @ts-ignore
  async onPartiallyPaid(debt, manager, oldDebt, user = "system") {
    logger.info(`[DebtTransition] Debt #${debt.id} partially paid, old status: ${oldDebt?.status}`);

    await this._logHistory(debt, manager, oldDebt, "partially_paid", user);
    await this._notifyWorker(debt, "partially paid");
  }

  /**
   * Called when a debt is cancelled.
   */
  // @ts-ignore
  async onCancel(debt, manager, oldDebt, user = "system") {
    logger.info(`[DebtTransition] Debt #${debt.id} cancelled, old status: ${oldDebt?.status}`);

    await this._logHistory(debt, manager, oldDebt, "cancelled", user);
    await this._notifyWorker(debt, "cancelled");
  }

  /**
   * Called when a debt becomes overdue.
   */
  // @ts-ignore
  async onOverdue(debt, manager, oldDebt, user = "system") {
    logger.info(`[DebtTransition] Debt #${debt.id} overdue, old status: ${oldDebt?.status}`);

    await this._logHistory(debt, manager, oldDebt, "overdue", user);
    await this._notifyWorker(debt, "overdue");
  }

  // --- Private helpers ---

  // @ts-ignore
  async _logHistory(debt, manager, oldDebt, transactionType, user) {
    const historyRepo = manager.getRepository(DebtHistory);
    const previousBalance = oldDebt?.balance ?? debt.balance; // fallback to current if old not available
    const newBalance = debt.balance;

    const history = historyRepo.create({
      debt: debt,
      amountPaid: 0, // no monetary change, just status
      previousBalance,
      newBalance,
      transactionType, // e.g., "paid", "cancelled"
      notes: `Status changed from ${oldDebt?.status} to ${debt.status}`,
      performedBy: user,
      referenceNumber: null,
      paymentMethod: null,
    });

    await saveDb(historyRepo, history);
    await auditLogger.logCreate("DebtHistory", history.id, history, user);
    logger.info(`[DebtTransition] DebtHistory #${history.id} created for debt #${debt.id}`);
  }

  // @ts-ignore
  async _notifyWorker(debt, action) {
    // (same as before – keep existing notification logic)
    const worker = debt.worker;
    if (!worker) {
      logger.warn(`[DebtTransition] No worker for debt #${debt.id} – notification skipped`);
      return;
    }

    const company = await companyName();

    const subject = `Debt ${action.charAt(0).toUpperCase() + action.slice(1)} – #${debt.id}`;
    let textBody = `Dear ${worker.name},\n\n`;
    textBody += `Your debt #${debt.id} has been marked as ${action}.\n\n`;
    textBody += `Original Amount: ${debt.originalAmount}\n`;
    textBody += `Current Balance: ${debt.balance}\n`;
    if (debt.reason) textBody += `Reason: ${debt.reason}\n`;
    textBody += `\nThank you,\n${company}`;

    const htmlBody = textBody.replace(/\n/g, "<br>");

    if (worker.email) {
      try {
        await emailSender.send(worker.email, subject, htmlBody, textBody, {}, true);
        logger.info(`[DebtTransition] ${action} email queued for worker ${worker.email} (debt #${debt.id})`);
      } catch (error) {
        // @ts-ignore
        logger.error(`[DebtTransition] Failed to queue email for debt #${debt.id}`, error);
      }
    }

    if (worker.contact) {
      try {
        const smsMessage = `Debt #${debt.id} has been ${action}. Check your email for details.`;
        await smsSender.send(worker.contact, smsMessage);
      } catch (error) {
        // @ts-ignore
        logger.error(`[DebtTransition] SMS failed for worker ${worker.contact}`, error);
      }
    }

    try {
      await notificationService.create(
        {
          userId: worker.id,
          title: `Debt ${action}`,
          message: `Debt #${debt.id} has been ${action}.`,
          type: action === "cancelled" || action === "overdue" ? "warning" : "info",
          metadata: { debtId: debt.id, status: action },
        },
        "system"
      );
    } catch (err) {
      // @ts-ignore
      logger.error(`[DebtTransition] Failed to create in-app notification for debt #${debt.id}`, err);
    }
  }
}

module.exports = { DebtStateTransitionService };