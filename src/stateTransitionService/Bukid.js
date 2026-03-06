// src/stateTransitionServices/BukidStateTransitionService.js
// @ts-check
const auditLogger = require("../utils/auditLogger");
const { logger } = require("../utils/logger");
const Pitak = require("../entities/Pitak");

class BukidStateTransitionService {
  // @ts-ignore
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.pitakRepo = dataSource.getRepository(Pitak);
  }

  /**
   * Called when a bukid is first created (status = "initiated").
   */
  // @ts-ignore
  async onInitiated(bukid, OldStatus, user = "system") {
    logger.info(`[BukidTransition] Bukid #${bukid.id} initiated.`);
    // Placeholder
  }

  /**
   * Called when a bukid becomes active.
   */
  // @ts-ignore
  async onActivate(bukid, oldStatus = null, user = "system") {
    logger.info(
      `[BukidTransition] Activating bukid #${bukid.id}, old status: ${oldStatus}`,
    );
  }

  /**
   * Called when a bukid is marked as complete.
   * Cascades: sets all associated pitaks to "completed".
   */
  // @ts-ignore
  async onComplete(bukid, oldStatus = null, user = "system") {
    logger.info(
      `[BukidTransition] Completing bukid #${bukid.id}, old status: ${oldStatus}`,
    );

    if (!bukid.pitaks || bukid.pitaks.length === 0) {
      logger.info(
        `[BukidTransition] Bukid #${bukid.id} has no pitaks, nothing to cascade.`,
      );
      return;
    }

    const pitakRepo = this.pitakRepo;
    for (const pitak of bukid.pitaks) {
      if (pitak.status !== "completed") {
        const oldPitakStatus = pitak.status;
        pitak.status = "completed";
        pitak.updatedAt = new Date();
        try {
          // @ts-ignore
          const savedPitak = await pitakRepo.save(pitak);
          await auditLogger.logUpdate(
            "Pitak",
            pitak.id,
            { status: oldPitakStatus },
            { status: "completed" },
            user,
          );
          logger.info(
            `[BukidTransition] Pitak #${pitak.id} set to complete due to bukid completion.`,
          );
        } catch (error) {
          // @ts-ignore
          logger.error(
            `[BukidTransition] Failed to update pitak #${pitak.id} to complete:`,
            // @ts-ignore
            error,
          );
          // Continue with other pitaks
        }
      }
    }

    logger.info(
      `[BukidTransition] Bukid #${bukid.id} completion cascade finished.`,
    );
  }

  /**
   * Called when a bukid becomes inactive.
   */
  // @ts-ignore
  async onCancelled(bukid, oldStatus = null, user = "system") {
    logger.info(
      `[BukidTransition] Inactivating bukid #${bukid.id}, old status: ${oldStatus}`,
    );
  }
}

module.exports = { BukidStateTransitionService };
