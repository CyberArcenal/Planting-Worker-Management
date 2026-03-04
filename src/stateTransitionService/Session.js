// src/stateTransitionServices/SessionStateTransitionService.js
// @ts-check
const { logger } = require("../utils/logger");

class SessionStateTransitionService {
  // @ts-ignore
  constructor(dataSource) {
    this.dataSource = dataSource;
    // Add repositories if needed later
  }

  /**
   * Called when a session becomes active.
   */
  // @ts-ignore
  async onActivate(session, manager, oldStatus = null, user = "system") {
    logger.info(`[SessionTransition] Activating session #${session.id}, old status: ${oldStatus}`);
    // Placeholder: future logic (e.g., ensure no other active session if not allowed)
  }

  /**
   * Called when a session is closed.
   */
  // @ts-ignore
  async onClose(session, manager, oldStatus = null, user = "system") {
    logger.info(`[SessionTransition] Closing session #${session.id}, old status: ${oldStatus}`);
    // Placeholder: future logic (e.g., freeze assignments, generate report)
  }

  /**
   * Called when a session is archived.
   */
  // @ts-ignore
  async onArchive(session, manager, oldStatus = null, user = "system") {
    logger.info(`[SessionTransition] Archiving session #${session.id}, old status: ${oldStatus}`);
    // Placeholder: future logic (e.g., move to long-term storage, prevent edits)
  }
}

module.exports = { SessionStateTransitionService };