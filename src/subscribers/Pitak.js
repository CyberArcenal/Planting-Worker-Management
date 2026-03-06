// src/subscribers/PitakSubscriber.js
// @ts-check
const Pitak = require("../entities/Pitak");
const { AppDataSource } = require("../main/db/datasource");
const {
  PitakStateTransitionService,
} = require("../stateTransitionService/Pitak");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading PitakSubscriber");

class PitakSubscriber {
  constructor() {
    this.transitionService = new PitakStateTransitionService(AppDataSource);
  }

  listenTo() {
    return Pitak;
  }

  /**
   * @param {any} entity
   */
  async afterInsert(entity) {
    try {
      // @ts-ignore
      logger.info("[PitakSubscriber] afterInsert", {
        entity: JSON.parse(JSON.stringify(entity)),
      });
      // Optionally call onInitiated if needed
    } catch (err) {
      // @ts-ignore
      logger.error("[PitakSubscriber] afterInsert error", err);
    }
  }

  /**
   * @param {{ entity: any; databaseEntity: any; }} event
   */
  async afterUpdate(event) {
    if (!event.entity) return;

    // @ts-ignore
    logger.info("[PitakSubscriber] afterUpdate", {
      entity: JSON.parse(JSON.stringify(event.entity)),
    });

    const oldPitak = event.databaseEntity;
    const newPitak = event.entity;

    // If status didn't change, skip
    if (oldPitak && oldPitak.status === newPitak.status) {
      return;
    }

    // Hydrate pitak with its assignments (needed for cascade)
    const hydrated = await this._hydratePitak(newPitak.id);
    if (!hydrated) return;

    switch (newPitak.status) {
      case "active":
        await this.transitionService.onActivate(
          hydrated,
          oldPitak?.status,
          // @ts-ignore
          "system",
        );
        break;
      case "completed":
        await this.transitionService.onComplete(
          hydrated,
          oldPitak?.status,
          // @ts-ignore
          "system",
        );
        break;
      case "cancelled":
        await this.transitionService.onCancelled(
          hydrated,
          oldPitak?.status,
          // @ts-ignore
          "system",
        );
        break;
      default:
        logger.warn(
          `[PitakSubscriber] Unhandled status transition: ${oldPitak?.status} -> ${newPitak.status}`,
        );
    }
  }

  /**
   * @param {any} pitakId
   */
  async _hydratePitak(pitakId) {
    const pitakRepo = AppDataSource.getRepository(Pitak);
    const pitak = await pitakRepo.findOne({
      where: { id: pitakId },
      relations: ["assignments"], // we need assignments for cascade
    });
    if (!pitak) {
      logger.error(
        `[PitakSubscriber] Pitak #${pitakId} not found for hydration`,
      );
      return null;
    }
    return pitak;
  }
}

module.exports = PitakSubscriber;
