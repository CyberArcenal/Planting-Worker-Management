// src/subscribers/PaymentSubscriber.js
// @ts-check
const Payment = require("../entities/Payment");

const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading PaymentSubscriber");

class PaymentSubscriber {
  constructor() {
    this.transitionService = null;
  }

  listenTo() {
    return Payment;
  }

  /**
   * @param {any} entity
   */
  async afterInsert(entity) {
    try {
      // @ts-ignore
      logger.info("[PaymentSubscriber] afterInsert", {
        entity: JSON.parse(JSON.stringify(entity)),
      });
    } catch (err) {
      // @ts-ignore
      logger.error("[PaymentSubscriber] afterInsert error", err);
    }
  }

  /**
   * @param {{ entity: any; databaseEntity: any; }} event
   */
  async afterUpdate(event) {
    if (!event.entity) return;
    const { AppDataSource } = require("../main/db/datasource");
    const {
      PaymentStateTransitionService,
    } = require("../stateTransitionService/Payment");
    this.transitionService = new PaymentStateTransitionService(AppDataSource);

    // @ts-ignore
    logger.info("[PaymentSubscriber] afterUpdate", {
      entity: JSON.parse(JSON.stringify(event.entity)),
    });

    const oldPayment = event.databaseEntity;
    const newPayment = event.entity;

    if (oldPayment && oldPayment.status === newPayment.status) return;

    const hydrated = await this._hydratePayment(newPayment.id);
    if (!hydrated) return;

    switch (newPayment.status) {
      case "completed":
        await this.transitionService.onCompleted(
          hydrated,
          oldPayment,
          "system",
        );
        break;
      case "cancelled":
        await this.transitionService.onCancelled(
          hydrated,
          oldPayment,
          "system",
        );
        break;
      case "partially_paid":
        await this.transitionService.onPartiallyPaid(
          hydrated,
          oldPayment,
          "system",
        );
        break;
      default:
        logger.warn(
          `[PaymentSubscriber] Unhandled status: ${newPayment.status}`,
        );
    }
  }

  /**
   * @param {any} paymentId
   */
  async _hydratePayment(paymentId) {
    const { AppDataSource } = require("../main/db/datasource");
    const paymentRepo = AppDataSource.getRepository(Payment);
    const payment = await paymentRepo.findOne({
      where: { id: paymentId },
      relations: ["worker", "pitak", "session", "assignment"],
    });
    if (!payment) {
      logger.error(`[PaymentSubscriber] Payment #${paymentId} not found`);
      return null;
    }
    return payment;
  }
}

module.exports = PaymentSubscriber;
