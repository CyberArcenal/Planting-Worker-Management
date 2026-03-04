// src/main/ipc/pitak/get/all.ipc.js
// @ts-check

const pitakService = require("../../../../../services/PitakService");
const { logger } = require("../../../../../utils/logger");

module.exports = async function getAllPitaks(params) {
  try {
    logger.info("IPC: getAllPitaks", { params });
    const pitaks = await pitakService.findAll(params);
    return { status: true, message: "Pitaks retrieved", data: pitaks };
  } catch (error) {
    logger.error("IPC: getAllPitaks error:", error);
    return { status: false, message: error.message || "Failed to retrieve pitaks", data: null };
  }
};