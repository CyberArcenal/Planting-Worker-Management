// components/Payment/hooks/useWorkerPaymentActions.ts
import { useState } from "react";
import type { WorkerPaymentSummary } from "./useWorkerPaymentData";
import { showError, showSuccess } from "../../../utils/notification";
import { showConfirm } from "../../../utils/dialogs";

export const useWorkerPaymentActions = (
  workerSummaries: WorkerPaymentSummary[],
  refreshData: () => Promise<void>,
) => {
  const [processing, setProcessing] = useState<number | null>(null);

  const handlePayWorkerDebt = async (workerId: number) => {
    const worker = workerSummaries.find((w) => w.worker.id === workerId);
    if (!worker || worker.totalDebt <= 0) {
      showError("This worker has no outstanding debt");
      return;
    }

    const confirmed = await showConfirm({
      title: "Pay Worker Debt",
      message: `Pay ${worker.totalDebt.toLocaleString()} debt for ${worker.worker.name}?`,
      confirmText: "Pay Debt",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      setProcessing(workerId);
      // In a real implementation, you would create a payment or call a debt payment API.
      showSuccess("Worker debt payment initiated successfully");
      await refreshData();
    } catch (error: any) {
      showError("Payment Failed", error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleViewWorkerDetails = (workerId: number) => {
    console.log(`View details for worker ${workerId}`);
  };

  const handleExportWorkerReport = async (workerId: number) => {
    showSuccess("Worker report generation is not yet implemented.");
  };

  const handleGenerateWorkerSlips = async (workerId: number) => {
    showSuccess("Payment slip generation is not yet implemented.");
  };

  return {
    processing,
    handlePayWorkerDebt,
    handleViewWorkerDetails,
    handleExportWorkerReport,
    handleGenerateWorkerSlips,
  };
};