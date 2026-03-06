// src/main/ipc/session/get/all.ipc.js
const sessionService = require("../../../../../services/SessionService");
const { logger } = require("../../../../../utils/logger");

module.exports = async function getAllSessions(params) {
  try {
    logger.info("IPC: getAllSessions", { params });
    const sessions = await sessionService.findAll(params);
    return { status: true, message: "Sessions retrieved", data: sessions };
  } catch (error) {
    logger.error("IPC: getAllSessions error:", error);
    return { status: false, message: error.message || "Failed to retrieve sessions", data: null };
  }
};