// src/subscribers/DebtSubscriber.js
// @ts-check
const Debt = require("../entities/Debt");

const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading DebtSubscriber");

class DebtSubscriber {
  constructor() {
    this.transitionService = null;
  }

  listenTo() {
    return Debt;
  }

  /**
   * @param {{ entity: any; }} event
   */
  async afterInsert(event) {
    const entity = event.entity;
    try {
      // @ts-ignore
      logger.info("[DebtSubscriber] afterInsert", {
        entity: JSON.parse(JSON.stringify(entity)),
      });
    } catch (err) {
      // @ts-ignore
      logger.error("[DebtSubscriber] afterInsert error", err);
    }
  }

  /**
   * @param {{ entity: any; databaseEntity: any; }} event
   */
  async afterUpdate(event) {
    if (!event.entity) return;
    const { AppDataSource } = require("../main/db/datasource");
    const {
      DebtStateTransitionService,
    } = require("../stateTransitionService/Debt");
    this.transitionService = new DebtStateTransitionService(AppDataSource);

    // @ts-ignore
    logger.info("[DebtSubscriber] afterUpdate", {
      entity: JSON.parse(JSON.stringify(event.entity)),
    });

    const oldDebt = event.databaseEntity;
    const newDebt = event.entity;

    if (oldDebt && oldDebt.status === newDebt.status) return;

    const hydrated = await this._hydrateDebt(newDebt.id);
    if (!hydrated) return;

    switch (newDebt.status) {
      case "partially_paid":
        await this.transitionService.onPartiallyPaid(
          hydrated,
          oldDebt,
          "system",
        );
        break;
      case "paid":
        await this.transitionService.onPaid(hydrated, oldDebt, "system");
        break;
      case "cancelled":
        await this.transitionService.onCancel(hydrated, oldDebt, "system");
        break;
      case "overdue":
        await this.transitionService.onOverdue(hydrated, oldDebt, "system");
        break;
      default:
        logger.warn(`[DebtSubscriber] Unhandled status: ${newDebt.status}`);
    }
  }

  /**
   * @param {any} debtId
   */
  async _hydrateDebt(debtId) {
    const { AppDataSource } = require("../main/db/datasource");
    const debtRepo = AppDataSource.getRepository(Debt);
    const debt = await debtRepo.findOne({
      where: { id: debtId },
      relations: ["worker", "session"],
    });
    if (!debt) {
      logger.error(`[DebtSubscriber] Debt #${debtId} not found`);
      return null;
    }
    return debt;
  }
}

module.exports = DebtSubscriber;
