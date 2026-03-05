// src/stateTransitionServices/AssignmentStateTransitionService.js
const auditLogger = require("../utils/auditLogger");
const { logger } = require("../utils/logger");
const notificationService = require("../services/Notification");
const emailSender = require("../channels/email.sender");
const smsSender = require("../channels/sms.sender");
const { farmRatePerLuwang, companyName } = require("../utils/settings/system");
const Payment = require("../entities/Payment");
const Assignment = require("../entities/Assignment");
const Pitak = require("../entities/Pitak");

class AssignmentStateTransitionService {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.paymentRepo = dataSource.getRepository(Payment);
  }

  /**
   * Recalculate and redistribute luwangCount equally among all active assignments
   * for a given pitak and session.
   */
  async recalculateLuWangForPitakSession(pitakId, sessionId, user = "system") {
    const pitakRepo = this.dataSource.getRepository(Pitak);
    const assignmentRepo = this.dataSource.getRepository(Assignment);

    // Fetch pitak to get totalLuwang
    const pitak = await pitakRepo.findOne({ where: { id: pitakId } });
    if (!pitak) {
      logger.error(`Pitak ${pitakId} not found during luwang recalculation`);
      return;
    }

    const totalLuwang = parseFloat(pitak.totalLuwang) || 0;

    // Fetch all active assignments for this pitak and session
    const activeAssignments = await assignmentRepo.find({
      where: {
        pitak: { id: pitakId },
        session: { id: sessionId },
        status: "active",
      },
    });

    const count = activeAssignments.length;
    if (count === 0) return;

    const luwangPerWorker = totalLuwang / count;
    const newLuWang = Math.round(luwangPerWorker * 100) / 100; // round to 2 decimals

    for (const assignment of activeAssignments) {
      if (assignment.luwangCount !== newLuWang) {
        const oldValue = assignment.luwangCount;
        assignment.luwangCount = newLuWang;
        assignment.updatedAt = new Date();
        await assignmentRepo.save(assignment);
        await auditLogger.logUpdate(
          "Assignment",
          assignment.id,
          { luwangCount: oldValue },
          { luwangCount: newLuWang },
          user
        );
        logger.info(
          `[AssignmentTransition] Assignment #${assignment.id} luwangCount updated from ${oldValue} to ${newLuWang}`
        );
      }
    }
  }

  async onInitiated(assignment, oldStatus = null, user = "system") {
    logger.info(
      `[AssignmentTransition] Assignment #${assignment.id} initiated.`
    );
    // Placeholder – no recalculation needed here (already done in subscriber afterInsert)
  }

  async onActivate(assignment, oldStatus = null, user = "system") {
    logger.info(
      `[AssignmentTransition] Activating assignment #${assignment.id}, old status: ${oldStatus}`
    );
    // No direct recalculation needed – subscriber will call recalc after status change.
  }

  async onComplete(assignment, oldStatus = null, user = "system") {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    logger.info(
      `[AssignmentTransition] Completing assignment #${assignment.id}, old status: ${oldStatus}`
    );

    // 1. Create payment automatically
    try {
      const rate = await farmRatePerLuwang();
      const grossPay = assignment.luwangCount * rate;
      const netPay = grossPay;

      const paymentData = {
        worker: assignment.worker,
        pitak: assignment.pitak,
        session: assignment.session,
        assignment: assignment,
        grossPay,
        netPay,
        status: "pending",
        paymentDate: null,
        periodStart: assignment.assignmentDate,
        periodEnd: assignment.assignmentDate,
        notes: `Auto-generated from completed assignment #${assignment.id}`,
      };

      const payment = this.paymentRepo.create(paymentData);
      const savedPayment = await saveDb(this.paymentRepo, payment);
      await auditLogger.logCreate(
        "Payment",
        savedPayment.id,
        savedPayment,
        user
      );

      logger.info(
        `[AssignmentTransition] Created payment #${savedPayment.id} for assignment #${assignment.id}`
      );
    } catch (error) {
      logger.error(
        `[AssignmentTransition] Failed to create payment for assignment #${assignment.id}:`,
        error
      );
    }

    // Recalculation already triggered by subscriber after status change, but we also need to notify.
    await this._notifyRelevantParties(assignment, "completed", oldStatus);
  }

  async onCancel(assignment, oldStatus = null, user = "system") {
    logger.info(
      `[AssignmentTransition] Cancelling assignment #${assignment.id}, old status: ${oldStatus}`
    );

    // Notify before we lose the pitak/session reference
    await this._notifyRelevantParties(assignment, "cancelled", oldStatus);

    // Recalculation is done by subscriber after status change.
  }

  // --- Private helpers ---

  async _notifyRelevantParties(assignment, action, oldStatus = null) {
    if (!assignment.worker) return;
    const worker = assignment.worker;
    const company = await companyName();

    const subject = `Assignment ${action} – #${assignment.id}`;
    let textBody = `Dear ${worker.name},\n\nYour assignment #${assignment.id} has been ${action}.`;
    if (action === "completed") {
      const rate = await farmRatePerLuwang();
      textBody += `\nLuWang: ${assignment.luwangCount} – payment ₱${assignment.luwangCount * rate} initiated.`;
    }
    const htmlBody = textBody.replace(/\n/g, "<br>");

    if (worker.email) {
      try {
        await emailSender.send(
          worker.email,
          subject,
          htmlBody,
          textBody,
          {},
          true
        );
      } catch (error) {
        logger.error(`[Notification] Email failed:`, error);
      }
    }
    if (worker.contact) {
      try {
        await smsSender.send(
          worker.contact,
          `Assignment #${assignment.id} has been ${action}.`
        );
      } catch (error) {
        logger.error(`[Notification] SMS failed:`, error);
      }
    }
    try {
      await notificationService.create(
        {
          userId: worker.id,
          title: `Assignment ${action}`,
          message: `Assignment #${assignment.id} has been ${action}.`,
          type: action === "cancelled" ? "warning" : "info",
          metadata: { assignmentId: assignment.id },
        },
        "system"
      );
    } catch (error) {
      logger.error(`[Notification] In-app notification failed:`, error);
    }
  }
}

module.exports = { AssignmentStateTransitionService };