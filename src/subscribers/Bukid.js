// src/subscribers/BukidSubscriber.js
// @ts-check
const Bukid = require("../entities/Bukid");

const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading BukidSubscriber");

class BukidSubscriber {
  constructor() {
    this.transitionService = null;
  }

  listenTo() {
    return Bukid;
  }


  /**
   * @param {{ id: any; }} entity
   */
  async afterInsert(entity) {
    const { AppDataSource } = require("../main/db/datasource");
    const {
      BukidStateTransitionService,
    } = require("../stateTransitionService/Bukid");
    this.transitionService = new BukidStateTransitionService(AppDataSource);
 
    try {
      // @ts-ignore
      logger.info("[BukidSubscriber] afterInsert", {
        entity: JSON.parse(JSON.stringify(entity)),
      });
      const hydrated = await this._hydrateBukid(entity.id);
      if (hydrated) {
        await this.transitionService.onInitiated(hydrated, "system");
      }
    } catch (err) {
      // @ts-ignore
      logger.error("[BukidSubscriber] afterInsert error", err);
    }
  }

  /**
   * @param {{ entity: any; databaseEntity: any; }} event
   */
  async afterUpdate(event) {
    if (!event.entity) return;
    const { AppDataSource } = require("../main/db/datasource");
    const {
      BukidStateTransitionService,
    } = require("../stateTransitionService/Bukid");
    this.transitionService = new BukidStateTransitionService(AppDataSource);

    // @ts-ignore
    logger.info("[BukidSubscriber] afterUpdate", {
      entity: JSON.parse(JSON.stringify(event.entity)),
    });

    const oldBukid = event.databaseEntity;
    const newBukid = event.entity;

    if (oldBukid && oldBukid.status === newBukid.status) {
      return;
    }

    const hydrated = await this._hydrateBukid(newBukid.id);
    if (!hydrated) return;

    switch (newBukid.status) {
      case "active":
        await this.transitionService.onActivate(
          hydrated,
          oldBukid?.status,
          "system",
        );
        break;
      case "completed":
        await this.transitionService.onComplete(
          hydrated,
          oldBukid?.status,
          "system",
        );
        break;
      case "cancelled":
        await this.transitionService.onCancelled(
          hydrated,
          oldBukid?.status,
          "system",
        );
        break;
      case "initiated":
        // Could happen if reset, but rare
        // @ts-ignore
        await this.transitionService.onInitiated(
          hydrated,
          oldBukid?.status,
          "system",
        );
        break;
      default:
        logger.warn(
          `[BukidSubscriber] Unhandled status transition: ${oldBukid?.status} -> ${newBukid.status}`,
        );
    }
  }

  // You can add beforeInsert, beforeUpdate, beforeRemove, afterRemove if needed

  /**
   * @param {any} bukidId
   */
  async _hydrateBukid(bukidId) {
    const { AppDataSource } = require("../main/db/datasource");
    const bukidRepo = AppDataSource.getRepository(Bukid);
    const bukid = await bukidRepo.findOne({
      where: { id: bukidId },
      relations: ["pitaks"], // we need pitaks for cascading complete
    });
    if (!bukid) {
      logger.error(
        `[BukidSubscriber] Bukid #${bukidId} not found for hydration`,
      );
      return null;
    }
    return bukid;
  }
}

module.exports = BukidSubscriber;
