// src/stateTransitionServices/WorkerStateTransitionService.js
// @ts-check
const { AppDataSource } = require("../main/db/datasource");
const { logger } = require("../utils/logger");
// Stub for notification sender (if needed)
// const emailSender = require("../channels/email.sender");
// const smsSender = require("../channels/sms.sender");

class WorkerStateTransitionService {
  // @ts-ignore
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  // @ts-ignore
  async onActivate(worker, oldStatus = null, user = "system") {
    logger.info(`[WorkerTransition] Worker #${worker.id} activated (old: ${oldStatus})`);
    // Example: could re-enable assignment creation
  }

  // @ts-ignore
  async onInactivate(worker, oldStatus = null, user = "system") {
    logger.info(`[WorkerTransition] Worker #${worker.id} inactivated (old: ${oldStatus})`);
    // Example: prevent new assignments, but existing ones remain
  }

  // @ts-ignore
  async onLeave(worker, oldStatus = null, user = "system") {
    logger.info(`[WorkerTransition] Worker #${worker.id} on leave (old: ${oldStatus})`);
    // Example: pause assignments, maybe notify supervisor
  }

  // @ts-ignore
  async onTerminate(worker, oldStatus = null, user = "system") {
    logger.info(`[WorkerTransition] Worker #${worker.id} terminated (old: ${oldStatus})`);

    // Example effects when worker is terminated:
    // 1. Cancel all active assignments (set status to cancelled)
    // 2. Flag outstanding debts for immediate collection? Or mark as bad debt?
    // 3. Send notification to HR/payroll
    // 4. Update session worker counts

    if (worker.assignments && worker.assignments.length > 0) {
      const assignmentRepo = AppDataSource.getRepository(require("../entities/Assignment"));
      for (const assignment of worker.assignments) {
        if (assignment.status === "active") {
          assignment.status = "cancelled";
          assignment.updatedAt = new Date();
          await assignmentRepo.save(assignment);
          logger.info(`[WorkerTransition] Cancelled active assignment #${assignment.id} due to worker termination.`);
          // This will trigger AssignmentSubscriber, which may create a payment? Actually cancellation should not create payment.
        }
      }
    }

    // Placeholder for notification
    // if (worker.email) {
    //   await emailSender.send(worker.email, "Employment Status", "You have been terminated.", ...);
    // }

    // If worker has outstanding debt, maybe flag it or send to collections
    // if (worker.debts && worker.debts.some(d => d.balance > 0)) {
    //   logger.info(`[WorkerTransition] Worker #${worker.id} has outstanding debt; flag for collection.`);
    // }
  }
}

module.exports = { WorkerStateTransitionService };