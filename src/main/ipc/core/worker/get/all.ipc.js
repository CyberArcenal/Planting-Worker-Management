// src/main/ipc/worker/get/all.ipc.js


const workerService = require("../../../../../services/WorkerService");
const { logger } = require("../../../../../utils/logger");

module.exports = async function getAllWorkers(params) {
  try {
    logger.info("IPC: getAllWorkers", { params });
    const workers = await workerService.findAll(params);
    return { status: true, message: "Workers retrieved", data: workers };
  } catch (error) {
    logger.error("IPC: getAllWorkers error:", error);
    return { status: false, message: error.message || "Failed to retrieve workers", data: null };
  }
};