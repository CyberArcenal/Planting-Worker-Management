// src/main/ipc/paymentHistory/get/all.ipc.js
// @ts-check

const paymentHistoryService = require("../../../../../services/PaymentHistoryService");
const { logger } = require("../../../../../utils/logger");

module.exports = async function getAllPaymentHistories(params) {
  try {
    logger.info("IPC: getAllPaymentHistories", { params });
    const histories = await paymentHistoryService.findAll(params);
    return { status: true, message: "Payment histories retrieved", data: histories };
  } catch (error) {
    logger.error("IPC: getAllPaymentHistories error:", error);
    return { status: false, message: error.message || "Failed to retrieve payment histories", data: null };
  }
};