// src/subscribers/AssignmentSubscriber.js
// @ts-check
const Assignment = require("../entities/Assignment");
const { AppDataSource } = require("../main/db/datasource");
const { AssignmentStateTransitionService } = require("../stateTransitionService/Assignment");
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
   * @param {any} entity
   */
  async beforeInsert(entity) {
    try {
      // @ts-ignore
      logger.info("[AssignmentSubscriber] beforeInsert", {
        entity: JSON.parse(JSON.stringify(entity)),
      });
    } catch (err) {
      // @ts-ignore
      logger.error("[AssignmentSubscriber] beforeInsert error", err);
    }
  }

  /**
   * @param {{ id: any; }} entity
   */
  async afterInsert(entity) {
    try {
      // @ts-ignore
      logger.info("[AssignmentSubscriber] afterInsert", {
        entity: JSON.parse(JSON.stringify(entity)),
      });
      // When a new assignment is created, it may be in 'pending' or 'active' state.
      // We'll treat it as "initiated" and call a method.
      const hydrated = await this._hydrateAssignment(entity.id);
      if (hydrated) {
        await this.transitionService.onInitiated(hydrated, "system");
      }
    } catch (err) {
      // @ts-ignore
      logger.error("[AssignmentSubscriber] afterInsert error", err);
    }
  }

  /**
   * @param {any} entity
   */
  async beforeUpdate(entity) {
    try {
      // @ts-ignore
      logger.info("[AssignmentSubscriber] beforeUpdate", {
        entity: JSON.parse(JSON.stringify(entity)),
      });
    } catch (err) {
      // @ts-ignore
      logger.error("[AssignmentSubscriber] beforeUpdate error", err);
    }
  }

  /**
   * @param {{ entity: any; databaseEntity: any; }} event
   */
  async afterUpdate(event) {
    if (!event.entity) return;

    // @ts-ignore
    logger.info("[AssignmentSubscriber] afterUpdate", {
      entity: JSON.parse(JSON.stringify(event.entity)),
    });

    const oldAssignment = event.databaseEntity;
    const newAssignment = event.entity;

    // If status didn't change, skip
    if (oldAssignment && oldAssignment.status === newAssignment.status) {
      return;
    }

    // Hydrate the assignment with needed relations
    const hydrated = await this._hydrateAssignment(newAssignment.id);
    if (!hydrated) return;

    // Handle each possible status transition
    switch (newAssignment.status) {
      case "active":
        // Only call onActivate if coming from initiated (or possibly other statuses)
        await this.transitionService.onActivate(
          hydrated,
          oldAssignment?.status,
          "system",
        );
        break;
      case "completed":
        await this.transitionService.onComplete(
          // @ts-ignore
          hydrated,
          oldAssignment?.status,
          "system",
        );
        break;
      case "cancelled":
        await this.transitionService.onCancel(
          hydrated,
          oldAssignment?.status,
          "system",
        );
        break;
      case "initiated":
        // Could happen if an active assignment is reset (rare)
        await this.transitionService.onInitiated(
          hydrated,
          oldAssignment?.status,
          // @ts-ignore
          "system",
        );
        break;
      default:
        logger.warn(
          `[AssignmentSubscriber] Unhandled status transition: ${oldAssignment?.status} -> ${newAssignment.status}`,
        );
    }
  }

  /**
   * @param {any} entity
   */
  async beforeRemove(entity) {
    try {
      // @ts-ignore
      logger.info("[AssignmentSubscriber] beforeRemove", {
        entity: JSON.parse(JSON.stringify(entity)),
      });
    } catch (err) {
      // @ts-ignore
      logger.error("[AssignmentSubscriber] beforeRemove error", err);
    }
  }

  /**
   * @param {any} event
   */
  async afterRemove(event) {
    try {
      // @ts-ignore
      logger.info("[AssignmentSubscriber] afterRemove", {
        event: JSON.parse(JSON.stringify(event)),
      });
    } catch (err) {
      // @ts-ignore
      logger.error("[AssignmentSubscriber] afterRemove error", err);
    }
  }

  /**
   * @param {any} assignmentId
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
