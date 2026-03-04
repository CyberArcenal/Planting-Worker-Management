// src/subscribers/SessionSubscriber.js
// @ts-check
const Session = require("../entities/Session");
const { AppDataSource } = require("../main/db/datasource");
const { SessionStateTransitionService } = require("../stateTransitionService/Session");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading SessionSubscriber");

class SessionSubscriber {
  constructor() {
    this.transitionService = new SessionStateTransitionService(AppDataSource);
  }

  listenTo() {
    return Session;
  }

  /**
   * @param {{ entity: any; }} event
   */
  async afterInsert(event) {
    const entity = event.entity;
    try {
      // @ts-ignore
      logger.info("[SessionSubscriber] afterInsert", {
        entity: JSON.parse(JSON.stringify(entity)),
      });
      // Optional: call onInitiated if you want
    } catch (err) {
      // @ts-ignore
      logger.error("[SessionSubscriber] afterInsert error", err);
    }
  }

  /**
   * @param {{ entity: any; databaseEntity: any; queryRunner: { manager: any; }; }} event
   */
  async afterUpdate(event) {
    if (!event.entity) return;

    // @ts-ignore
    logger.info("[SessionSubscriber] afterUpdate", {
      entity: JSON.parse(JSON.stringify(event.entity)),
    });

    const oldSession = event.databaseEntity;
    const newSession = event.entity;

    // If status didn't change, skip
    if (oldSession && oldSession.status === newSession.status) {
      return;
    }

    // Use the transaction manager from the event
    const manager = event.queryRunner.manager;
    const hydrated = await this._hydrateSession(newSession.id, manager);
    if (!hydrated) return;

    switch (newSession.status) {
      case "active":
        await this.transitionService.onActivate(hydrated, manager, oldSession?.status, "system");
        break;
      case "closed":
        await this.transitionService.onClose(hydrated, manager, oldSession?.status, "system");
        break;
      case "archived":
        await this.transitionService.onArchive(hydrated, manager, oldSession?.status, "system");
        break;
      default:
        logger.warn(`[SessionSubscriber] Unhandled status transition: ${oldSession?.status} -> ${newSession.status}`);
    }
  }

  /**
   * @param {any} sessionId
   * @param {{ getRepository: (arg0: import("typeorm").EntitySchema<{ id: unknown; name: unknown; seasonType: unknown; year: unknown; startDate: unknown; endDate: unknown; status: unknown; createdAt: unknown; updatedAt: unknown; }>) => any; }} manager
   */
  async _hydrateSession(sessionId, manager) {
    const sessionRepo = manager.getRepository(Session);
    const session = await sessionRepo.findOne({
      where: { id: sessionId },
      // Add relations if needed for future logic (e.g., bukids, assignments)
      relations: [],
    });
    if (!session) {
      logger.error(`[SessionSubscriber] Session #${sessionId} not found for hydration`);
      return null;
    }
    return session;
  }
}

module.exports = SessionSubscriber;