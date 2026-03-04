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

  async onInitiated(assignment, oldStatus = null, user = "system") {
    logger.info(
      `[AssignmentTransition] Assignment #${assignment.id} initiated.`,
    );
    // Placeholder
  }

  async onActivate(assignment, oldStatus = null, user = "system") {
    logger.info(
      `[AssignmentTransition] Activating assignment #${assignment.id}, old status: ${oldStatus}`,
    );
    // Placeholder
  }

  async onComplete(assignment, oldStatus = null, user = "system") {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    logger.info(
      `[AssignmentTransition] Completing assignment #${assignment.id}, old status: ${oldStatus}`,
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
        user,
      );

      logger.info(
        `[AssignmentTransition] Created payment #${savedPayment.id} for assignment #${assignment.id}`,
      );
    } catch (error) {
      logger.error(
        `[AssignmentTransition] Failed to create payment for assignment #${assignment.id}:`,
        error,
      );
    }

    await this._notifyRelevantParties(assignment, "completed", oldStatus);
  }

  async onCancel(assignment, oldStatus = null, user = "system") {
    logger.info(
      `[AssignmentTransition] Cancelling assignment #${assignment.id}, old status: ${oldStatus}`,
    );

    const pitak = assignment.pitak;
    if (!pitak) {
      logger.warn(
        `[AssignmentTransition] No pitak found for assignment #${assignment.id}, cannot redistribute.`,
      );
      return;
    }

    // Get repositories from dataSource
    const assignmentRepo = this.dataSource.getRepository(Assignment);
    const pitakRepo = this.dataSource.getRepository(Pitak);

    // Fetch the pitak with its totalLuwang (capacity)
    const pitakWithCapacity = await pitakRepo.findOne({
      where: { id: pitak.id },
    });
    if (!pitakWithCapacity) {
      logger.error(
        `[AssignmentTransition] Pitak #${pitak.id} not found during cancellation.`,
      );
      return;
    }

    // Fetch all other active assignments for this pitak (excluding the one being cancelled)
    const activeAssignments = await assignmentRepo.find({
      where: {
        pitak: { id: pitak.id },
        status: "active", // only active assignments
        id: { $ne: assignment.id }, // exclude the current one (though it's being cancelled)
      },
    });

    if (activeAssignments.length === 0) {
      logger.info(
        `[AssignmentTransition] No active assignments left for pitak #${pitak.id}. Nothing to redistribute.`,
      );
      return;
    }

    const pitakCapacity = parseFloat(pitakWithCapacity.totalLuwang) || 0;
    // Divide capacity equally among remaining assignments (floor to avoid exceeding)
    const newLuWangPerAssignment = Math.floor(
      pitakCapacity / activeAssignments.length,
    );

    if (newLuWangPerAssignment < 1) {
      logger.warn(
        `[AssignmentTransition] Pitak capacity (${pitakCapacity}) too small to distribute among ${activeAssignments.length} assignments.`,
      );
      // Optionally set to 0 or handle error
    }

    // Update each active assignment
    for (const active of activeAssignments) {
      const oldLuWang = active.luwangCount;
      active.luwangCount = newLuWangPerAssignment;
      active.updatedAt = new Date();
      await assignmentRepo.save(active);
      await auditLogger.logUpdate(
        "Assignment",
        active.id,
        { luwangCount: oldLuWang },
        { luwangCount: newLuWangPerAssignment },
        user,
      );
      logger.info(
        `[AssignmentTransition] Assignment #${active.id} luwangCount updated from ${oldLuWang} to ${newLuWangPerAssignment}`,
      );
    }

    // Notify
    await this._notifyRelevantParties(assignment, "cancelled", oldStatus);
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
          true,
        );
      } catch (error) {
        logger.error(`[Notification] Email failed:`, error);
      }
    }
    if (worker.contact) {
      try {
        await smsSender.send(
          worker.contact,
          `Assignment #${assignment.id} has been ${action}.`,
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
        "system",
      );
    } catch (error) {
      logger.error(`[Notification] In-app notification failed:`, error);
    }
  }
}

module.exports = { AssignmentStateTransitionService };
