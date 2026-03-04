// src/subscribers/WorkerSubscriber.js
// @ts-check
const Worker = require("../entities/Worker");
const { AppDataSource } = require("../main/db/datasource");
const { WorkerStateTransitionService } = require("../stateTransitionService/Worker");
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
   * @param {{ entity: any; }} event
   */
  async afterInsert(event) {
    const entity = event.entity;
    try {
      // @ts-ignore
      logger.info("[WorkerSubscriber] afterInsert", { entity: JSON.parse(JSON.stringify(entity)) });
    } catch (err) {
      // @ts-ignore
      logger.error("[WorkerSubscriber] afterInsert error", err);
    }
  }

  /**
   * @param {{ entity: any; databaseEntity: any; queryRunner: { manager: any; }; }} event
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

    const manager = event.queryRunner.manager;
    const hydrated = await this._hydrateWorker(newWorker.id, manager);
    if (!hydrated) return;

    switch (newWorker.status) {
      case "active":
        await this.transitionService.onActivate(hydrated, manager, oldWorker?.status, "system");
        break;
      case "inactive":
        await this.transitionService.onInactivate(hydrated, manager, oldWorker?.status, "system");
        break;
      case "on-leave":
        await this.transitionService.onLeave(hydrated, manager, oldWorker?.status, "system");
        break;
      case "terminated":
        await this.transitionService.onTerminate(hydrated, manager, oldWorker?.status, "system");
        break;
      default:
        logger.warn(`[WorkerSubscriber] Unhandled status: ${newWorker.status}`);
    }
  }

  /**
   * @param {any} workerId
   * @param {{ getRepository: (arg0: import("typeorm").EntitySchema<{ id: unknown; name: unknown; contact: unknown; email: unknown; address: unknown; status: unknown; hireDate: unknown; createdAt: unknown; updatedAt: unknown; }>) => any; }} manager
   */
  async _hydrateWorker(workerId, manager) {
    const workerRepo = manager.getRepository(Worker);
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