// src/stateTransitionServices/PitakStateTransitionService.js
// @ts-check
const auditLogger = require("../utils/auditLogger");
const { logger } = require("../utils/logger");
const Assignment = require("../entities/Assignment");
const { AppDataSource } = require("../main/db/datasource");

class PitakStateTransitionService {
  // @ts-ignore
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Called when a pitak becomes active.
   */
  // @ts-ignore
  async onActivate(pitak, oldStatus = null, user = "system") {
    logger.info(
      `[PitakTransition] Activating pitak #${pitak.id}, old status: ${oldStatus}`,
    );
    // Placeholder: maybe update bukid's active pitak count, or log
  }

  /**
   * Called when a pitak is marked as complete.
   * Cascades: sets all associated assignments to "completed".
   * The assignment status change will trigger the Assignment transition service,
   * which will handle payment creation automatically.
   */
  // @ts-ignore
  async onComplete(pitak, oldStatus = null, user = "system") {
    logger.info(
      `[PitakTransition] Completing pitak #${pitak.id}, old status: ${oldStatus}`,
    );

    if (!pitak.assignments || pitak.assignments.length === 0) {
      logger.info(
        `[PitakTransition] Pitak #${pitak.id} has no assignments, nothing to cascade.`,
      );
      return;
    }

    const assignmentRepo = AppDataSource.getRepository(Assignment);

    for (const assignment of pitak.assignments) {
      if (assignment.status !== "completed") {
        const oldStatus = assignment.status;
        assignment.status = "completed";
        assignment.updatedAt = new Date();
        try {
          await assignmentRepo.save(assignment);
          await auditLogger.logUpdate(
            "Assignment",
            assignment.id,
            { status: oldStatus },
            { status: "completed" },
            user,
          );
          logger.info(
            `[PitakTransition] Assignment #${assignment.id} set to complete due to pitak completion.`,
          );
        } catch (error) {
          logger.error(
            `[PitakTransition] Failed to update assignment #${assignment.id}:`,
            // @ts-ignore
            error,
          );
          // Re-throw to rollback the transaction (subscriber will rollback automatically)
          throw error;
        }
      }
    }

    logger.info(
      `[PitakTransition] Pitak #${pitak.id} completion cascade finished.`,
    );
  }

  /**
   * Called when a pitak becomes inactive.
   */
  // @ts-ignore
  async onCancelled(pitak, oldStatus = null, user = "system") {
    logger.info(
      `[PitakTransition] Inactivating pitak #${pitak.id}, old status: ${oldStatus}`,
    );
    // Example: prevent new assignments, but existing ones remain
  }
}

module.exports = { PitakStateTransitionService };
