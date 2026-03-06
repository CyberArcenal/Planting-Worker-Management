// src/stateTransitionServices/SessionStateTransitionService.js
// @ts-check
 const { logger} = require("../utils/logger");
class SessionStateTransitionService {
  // @ts-ignore
  constructor(dataSource) {
    this.dataSource = dataSource;
    // Add repositories if needed later
  }

  /**
   * Called when a session becomes active.
   * Sets this session as the default session in system settings
   * and closes any other active sessions.
   *
   * @param {Session} session - The activated session
   * @param {string|null} oldStatus - Previous status
   * @param {string} user - User performing the action
   */
  async onActivate(session, oldStatus = null, user = "system") {
    const Session = require("../entities/Session");
    const {
      SystemSetting,
      SettingType,
    } = require("../entities/systemSettings");
    const { AppDataSource } = require("../main/db/datasource");
    const { updateDb, saveDb } = require("../utils/dbUtils/dbActions");
   
    logger.info(
      `[SessionTransition] Activating session #${session.id}, old status: ${oldStatus}`,
    );

    const sessionRepo = AppDataSource.getRepository(Session);
    const settingRepo = AppDataSource.getRepository(SystemSetting);

    // 1. Close any other active sessions
    const otherActiveSessions = await sessionRepo
      .createQueryBuilder("session")
      .where("session.status = :status", { status: "active" })
      .andWhere("session.id != :id", { id: session.id })
      .getMany();

    for (const other of otherActiveSessions) {
      other.status = "closed";
      other.updatedAt = new Date();
      await updateDb(sessionRepo, other);
      logger.info(`[SessionTransition] Closed session #${other.id}`);
    }

    // 2. Update or create the default_session_id setting
    const settingKey = "default_session_id";
    const settingType = SettingType.FARM_SESSION;

    let defaultSetting = await settingRepo.findOne({
      where: { key: settingKey, setting_type: settingType, is_deleted: false },
    });

    if (defaultSetting) {
      defaultSetting.value = String(session.id);
      defaultSetting.updated_at = new Date();
      await updateDb(settingRepo, defaultSetting);
    } else {
      defaultSetting = settingRepo.create({
        key: settingKey,
        value: String(session.id),
        setting_type: settingType,
        description: "Default session ID used throughout the farm",
        is_public: false,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      });
      await saveDb(settingRepo, defaultSetting);
    }

    logger.info(
      `[SessionTransition] Default session set to #${session.id} (setting ID: ${defaultSetting.id})`,
    );
  }

  /**
   * Called when a session is closed.
   */
  // @ts-ignore
  async onClose(session, oldStatus = null, user = "system") {
    logger.info(
      `[SessionTransition] Closing session #${session.id}, old status: ${oldStatus}`,
    );
    // Placeholder: future logic (e.g., freeze assignments, generate report)
  }

  /**
   * Called when a session is archived.
   */
  // @ts-ignore
  async onArchive(session, oldStatus = null, user = "system") {
    logger.info(
      `[SessionTransition] Archiving session #${session.id}, old status: ${oldStatus}`,
    );
    // Placeholder: future logic (e.g., move to long-term storage, prevent edits)
  }
}

module.exports = { SessionStateTransitionService };
