// src/subscribers/AssignmentSubscriber.js
const Assignment = require("../entities/Assignment");
const { AppDataSource } = require("../main/db/datasource");
const {
  AssignmentStateTransitionService,
} = require("../stateTransitionService/Assignment");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading AssignmentSubscriber");

class AssignmentSubscriber {
  constructor() {
    this.transitionService = new AssignmentStateTransitionService(
      AppDataSource,
    );
  }

  listenTo() {
    return Assignment;
  }

  /**
   * @param {Assignment} entity
   */
  async beforeInsert(entity) {
    try {
      logger.info("[AssignmentSubscriber] beforeInsert", {
        id: entity.id,
        status: entity.status,
      });
    } catch (err) {
      logger.error("[AssignmentSubscriber] beforeInsert logging error", err);
    }
  }

  /**
   * @param {Assignment} entity - The saved assignment (may not have relations)
   */
  async afterInsert(entity) {
    try {
      logger.info("[AssignmentSubscriber] afterInsert", {
        id: entity.id,
        status: entity.status,
      });

      const hydrated = await this._hydrateAssignment(entity.id);
      if (!hydrated) return;

      const pitakId = hydrated.pitak?.id;
      const sessionId = hydrated.session?.id;
      if (pitakId && sessionId) {
        await this.transitionService.recalculateLuWangForPitakSession(
          pitakId,
          sessionId,
          "system",
        );
      }

      await this.transitionService.onInitiated(hydrated, null, "system");
    } catch (err) {
      logger.error("[AssignmentSubscriber] afterInsert error", err);
    }
  }

  /**
   * @param {Assignment} entity
   */
  async beforeUpdate(entity) {
    try {
      logger.info("[AssignmentSubscriber] beforeUpdate", {
        id: entity.id,
        status: entity.status,
      });
    } catch (err) {
      logger.error("[AssignmentSubscriber] beforeUpdate logging error", err);
    }
  }

  /**
   * @param {{ databaseEntity: Assignment, entity: Assignment }} event
   */
  async afterUpdate(event) {
    const { databaseEntity, entity } = event;
    if (!entity) return;

    try {
      logger.info("[AssignmentSubscriber] afterUpdate", {
        id: entity.id,
        oldStatus: databaseEntity?.status,
        newStatus: entity.status,
      });

      const oldStatus = databaseEntity?.status;
      const newStatus = entity.status;

      if (oldStatus !== newStatus) {
        const hydrated = await this._hydrateAssignment(entity.id);
        if (!hydrated) return;

        const pitakId = hydrated.pitak?.id;
        const sessionId = hydrated.session?.id;
        if (pitakId && sessionId) {
          await this.transitionService.recalculateLuWangForPitakSession(
            pitakId,
            sessionId,
            "system",
          );
        }

        switch (newStatus) {
          case "active":
            await this.transitionService.onActivate(
              hydrated,
              oldStatus,
              "system",
            );
            break;
          case "completed":
            await this.transitionService.onComplete(
              hydrated,
              oldStatus,
              "system",
            );
            break;
          case "cancelled":
            await this.transitionService.onCancel(
              hydrated,
              oldStatus,
              "system",
            );
            break;
          case "initiated":
            await this.transitionService.onInitiated(
              hydrated,
              oldStatus,
              "system",
            );
            break;
          default:
            logger.warn(
              `[AssignmentSubscriber] Unhandled status transition: ${oldStatus} -> ${newStatus}`,
            );
        }
      }
    } catch (err) {
      logger.error("[AssignmentSubscriber] afterUpdate error", err);
    }
  }

  /**
   * @param {Assignment} entity
   */
  async beforeRemove(entity) {
    try {
      logger.info("[AssignmentSubscriber] beforeRemove", {
        id: entity.id,
        status: entity.status,
      });
    } catch (err) {
      logger.error("[AssignmentSubscriber] beforeRemove logging error", err);
    }
  }

  /**
   * @param {{ databaseEntity: Assignment, entityId: number }} event
   */
  async afterRemove(event) {
    const { databaseEntity, entityId } = event;
    try {
      logger.info("[AssignmentSubscriber] afterRemove", {
        id: entityId,
        status: databaseEntity?.status,
        pitakId: databaseEntity?.pitak?.id,
        sessionId: databaseEntity?.session?.id,
      });

      if (databaseEntity?.pitak?.id && databaseEntity?.session?.id) {
        await this.transitionService.recalculateLuWangForPitakSession(
          databaseEntity.pitak.id,
          databaseEntity.session.id,
          "system",
        );
      }
    } catch (err) {
      logger.error("[AssignmentSubscriber] afterRemove error", err);
    }
  }

  /**
   * @param {number} assignmentId
   * @returns {Promise<Assignment|null>}
   */
  async _hydrateAssignment(assignmentId) {
    const assignmentRepo = AppDataSource.getRepository(Assignment);
    const assignment = await assignmentRepo.findOne({
      where: { id: assignmentId },
      relations: ["worker", "pitak", "session"],
    });
    if (!assignment) {
      logger.error(
        `[AssignmentSubscriber] Assignment #${assignmentId} not found for hydration`,
      );
      return null;
    }
    return assignment;
  }
}

module.exports = AssignmentSubscriber;
