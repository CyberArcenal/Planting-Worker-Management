// src/main/ipc/session/get/active.ipc.js
// @ts-check

const sessionService = require("../../../../../services/SessionService");
const { logger } = require("../../../../../utils/logger");

module.exports = async function getActiveSession(params) {
  try {
    logger.info("IPC: getActiveSession", { params });
    // Return the currently active session (status = 'active')
    const sessions = await sessionService.findAll({ status: 'active' });
    const active = sessions.length > 0 ? sessions[0] : null; // Assuming only one active session
    return { status: true, message: "Active session retrieved", data: active };
  } catch (error) {
    logger.error("IPC: getActiveSession error:", error);
    return { status: false, message: error.message || "Failed to retrieve active session", data: null };
  }
};