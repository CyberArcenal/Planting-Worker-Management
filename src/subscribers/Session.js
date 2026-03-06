// src/subscribers/SessionSubscriber.js
// @ts-check
const Session = require("../entities/Session");

const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading SessionSubscriber");

class SessionSubscriber {
  constructor() {
    this.transitionService = null;
  }

  listenTo() {
    return Session;
  }

  /**
   * @param {any} entity
   */
  async afterInsert(entity) {
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
   * @param {{ entity: any; databaseEntity: any; }} event
   */
  async afterUpdate(event) {
    if (!event.entity) return;
    const { AppDataSource } = require("../main/db/datasource");
    const {
      SessionStateTransitionService,
    } = require("../stateTransitionService/Session");
    this.transitionService = new SessionStateTransitionService(AppDataSource);

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

    // Hydrate session with needed relations
    const hydrated = await this._hydrateSession(newSession.id);
    if (!hydrated) return;

    switch (newSession.status) {
      case "active":
        await this.transitionService.onActivate(
          hydrated,
          oldSession?.status,
          // @ts-ignore
          "system",
        );
        break;
      case "closed":
        await this.transitionService.onClose(
          hydrated,
          oldSession?.status,
          // @ts-ignore
          "system",
        );
        break;
      case "archived":
        await this.transitionService.onArchive(
          hydrated,
          oldSession?.status,
          // @ts-ignore
          "system",
        );
        break;
      default:
        logger.warn(
          `[SessionSubscriber] Unhandled status transition: ${oldSession?.status} -> ${newSession.status}`,
        );
    }
  }

  /**
   * @param {any} sessionId
   */
  async _hydrateSession(sessionId) {
     const { AppDataSource } = require("../main/db/datasource");
    const sessionRepo = AppDataSource.getRepository(Session);
    const session = await sessionRepo.findOne({
      where: { id: sessionId },
      // Add relations if needed for future logic (e.g., bukids, assignments)
      relations: [],
    });
    if (!session) {
      logger.error(
        `[SessionSubscriber] Session #${sessionId} not found for hydration`,
      );
      return null;
    }
    return session;
  }
}

module.exports = SessionSubscriber;
