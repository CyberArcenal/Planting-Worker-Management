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
   * @param {{ entity: any; }} event
   */
  async afterInsert(event) {
    const entity = event.entity;
    try {
      // @ts-ignore
      logger.info("[PitakSubscriber] afterInsert", {
        entity: JSON.parse(JSON.stringify(entity)),
      });
      // Optionally call onInitiated if needed (but pitak may not have initiated status)
    } catch (err) {
      // @ts-ignore
      logger.error("[PitakSubscriber] afterInsert error", err);
    }
  }

  /**
   * @param {{ entity: any; databaseEntity: any; queryRunner: { manager: any; }; }} event
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
    const manager = event.queryRunner.manager;
    const hydrated = await this._hydratePitak(newPitak.id, manager);
    if (!hydrated) return;

    // Use the transaction manager from the event
    switch (newPitak.status) {
      case "active":
        await this.transitionService.onActivate(
          hydrated,
          manager,
          oldPitak?.status,
          "system",
        );
        break;
      case "complete":
        await this.transitionService.onComplete(
          hydrated,
          manager,
          oldPitak?.status,
          "system",
        );
        break;
      case "inactive":
        await this.transitionService.onInactivate(
          hydrated,
          manager,
          oldPitak?.status,
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
   * @param {{ getRepository: (arg0: import("typeorm").EntitySchema<{ id: unknown; location: unknown; totalLuwang: unknown; layoutType: unknown; sideLengths: unknown; areaSqm: unknown; notes: unknown; status: unknown; createdAt: unknown; updatedAt: unknown; }>) => any; }} manager
   */
  async _hydratePitak(pitakId, manager) {
    const pitakRepo = manager.getRepository(Pitak);
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
