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
   * @param {{ entity: any; }} event
   */
  async afterInsert(event) {
    const entity = event.entity;
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
   * @param {{ entity: any; databaseEntity: any; queryRunner: { manager: any; }; }} event
   */
  async afterUpdate(event) {
    const { AppDataSource } = require("../main/db/datasource");
    const {
      PaymentStateTransitionService,
    } = require("../stateTransitionService/Payment");
    this.transitionService = new PaymentStateTransitionService(AppDataSource);
    if (!event.entity) return;

    // @ts-ignore
    logger.info("[PaymentSubscriber] afterUpdate", {
      entity: JSON.parse(JSON.stringify(event.entity)),
    });

    const oldPayment = event.databaseEntity;
    const newPayment = event.entity;

    if (oldPayment && oldPayment.status === newPayment.status) return;

    const manager = event.queryRunner.manager;
    const hydrated = await this._hydratePayment(newPayment.id, manager);
    if (!hydrated) return;

    switch (newPayment.status) {
      case "processing":
        await this.transitionService.onProcessing(
          hydrated,
          manager,
          oldPayment,
          "system",
        );
        break;
      case "completed":
        await this.transitionService.onCompleted(
          hydrated,
          manager,
          oldPayment,
          "system",
        );
        break;
      case "cancelled":
        await this.transitionService.onCancelled(
          hydrated,
          manager,
          oldPayment,
          "system",
        );
        break;
      case "partially_paid":
        await this.transitionService.onPartiallyPaid(
          hydrated,
          manager,
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
   * @param {{ getRepository: (arg0: import("typeorm").EntitySchema<{ id: unknown; grossPay: unknown; manualDeduction: unknown; netPay: unknown; status: unknown; paymentDate: unknown; paymentMethod: unknown; referenceNumber: unknown; periodStart: unknown; periodEnd: unknown; totalDebtDeduction: unknown; otherDeductions: unknown; deductionBreakdown: unknown; notes: unknown; createdAt: unknown; updatedAt: unknown; idempotencyKey: unknown; }>) => any; }} manager
   */
  async _hydratePayment(paymentId, manager) {
    const paymentRepo = manager.getRepository(Payment);
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
