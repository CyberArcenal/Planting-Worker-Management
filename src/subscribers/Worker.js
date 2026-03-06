// src/subscribers/WorkerSubscriber.js
// @ts-check
const Worker = require("../entities/Worker");
const { AppDataSource } = require("../main/db/datasource");
const {
  WorkerStateTransitionService,
} = require("../stateTransitionService/Worker");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading WorkerSubscriber");

class WorkerSubscriber {
  constructor() {
    this.transitionService = new WorkerStateTransitionService(AppDataSource);
  }

  listenTo() {
    return Worker;
  }


  /**
   * @param {any} entity
   */
  async afterInsert(entity) {
    try {
      // @ts-ignore
      logger.info("[WorkerSubscriber] afterInsert", {
        entity: JSON.parse(JSON.stringify(entity)),
      });
    } catch (err) {
      // @ts-ignore
      logger.error("[WorkerSubscriber] afterInsert error", err);
    }
  }

  /**
   * @param {{ entity: any; databaseEntity: any; }} event
   */
  async afterUpdate(event) {
    if (!event.entity) return;

    // @ts-ignore
    logger.info("[WorkerSubscriber] afterUpdate", {
      entity: JSON.parse(JSON.stringify(event.entity)),
    });

    const oldWorker = event.databaseEntity;
    const newWorker = event.entity;

    if (oldWorker && oldWorker.status === newWorker.status) return;

    const hydrated = await this._hydrateWorker(newWorker.id);
    if (!hydrated) return;

    switch (newWorker.status) {
      case "active":
        await this.transitionService.onActivate(
          hydrated,
          oldWorker?.status,
          // @ts-ignore
          "system",
        );
        break;
      case "inactive":
        await this.transitionService.onInactivate(
          hydrated,
          oldWorker?.status,
          // @ts-ignore
          "system",
        );
        break;
      case "on-leave":
        await this.transitionService.onLeave(
          hydrated,
          oldWorker?.status,
          // @ts-ignore
          "system",
        );
        break;
      case "terminated":
        await this.transitionService.onTerminate(
          hydrated,
          oldWorker?.status,
          // @ts-ignore
          "system",
        );
        break;
      default:
        logger.warn(`[WorkerSubscriber] Unhandled status: ${newWorker.status}`);
    }
  }

  /**
   * @param {any} workerId
   */
  async _hydrateWorker(workerId) {
    const workerRepo = AppDataSource.getRepository(Worker);
    const worker = await workerRepo.findOne({
      where: { id: workerId },
      // relations needed for effects (e.g., assignments, debts)
      relations: ["assignments", "debts"],
    });
    if (!worker) {
      logger.error(`[WorkerSubscriber] Worker #${workerId} not found`);
      return null;
    }
    return worker;
  }
}

module.exports = WorkerSubscriber;
