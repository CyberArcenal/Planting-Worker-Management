// components/Payment/hooks/usePaymentActions.ts
import { useCallback } from "react";
import { showConfirm } from "../../../utils/dialogs";
import paymentAPI, { type Payment } from "../../../api/core/payment";
import { showError, showSuccess, showToast } from "../../../utils/notification";

export const usePaymentActions = (
  payments: Payment[],
  fetchPayments: () => Promise<void>,
  selectedPayments: number[],
  setSelectedPayments: React.Dispatch<React.SetStateAction<number[]>>,
) => {
  const handleDeletePayment = useCallback(
    async (id: number) => {
      const confirmed = await showConfirm({
        title: "Delete Payment",
        message: `Are you sure you want to delete payment #${id}?`,
        icon: "danger",
        confirmText: "Delete",
        cancelText: "Cancel",
      });
      if (!confirmed) return;

      try {
        showToast("Deleting payment...", "info");
        const response = await paymentAPI.delete(id);
        if (response.status) {
          showSuccess("Payment deleted successfully");
          fetchPayments();
          setSelectedPayments((prev) => prev.filter((item) => item !== id));
        } else {
          throw new Error(response.message);
        }
      } catch (err: any) {
        showError(err.message || "Failed to delete payment");
      }
    },
    [fetchPayments, setSelectedPayments],
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedPayments.length === 0) return;

    const confirmed = await showConfirm({
      title: "Bulk Delete Confirmation",
      message: `Are you sure you want to delete ${selectedPayments.length} selected payment(s)?`,
      icon: "danger",
      confirmText: "Delete All",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      showToast("Deleting selected payments...", "info");
      const results = await Promise.allSettled(
        selectedPayments.map((id) => paymentAPI.delete(id))
      );
      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value.status
      );
      const failed = results.filter(
        (r) => r.status === "rejected" || !r.value?.status
      );

      if (failed.length === 0) {
        showSuccess(`Successfully deleted ${successful.length} payment(s)`);
      } else {
        showError(
          `Deleted ${successful.length} payment(s), failed to delete ${failed.length}`
        );
      }
      fetchPayments();
      setSelectedPayments([]);
    } catch (err: any) {
      showError(err.message || "Failed to delete payments");
    }
  }, [selectedPayments, fetchPayments, setSelectedPayments]);

  const handleExportCSV = useCallback(async () => {
    if (payments.length === 0) {
      showToast("No data to export", "warning");
      return;
    }

    try {
      showToast("Exporting to CSV...", "info");
      const headers = ["ID", "Date", "Worker", "Gross Pay", "Net Pay", "Method", "Status", "Reference", "Notes"];
      const rows = payments.map((p) => [
        p.id,
        p.paymentDate || "",
        p.worker?.name || "",
        p.grossPay,
        p.netPay,
        p.paymentMethod || "",
        p.status,
        p.referenceNumber || "",
        p.notes || "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess(`Exported ${payments.length} records to CSV`);
    } catch (err: any) {
      showError(err.message || "Failed to export CSV");
    }
  }, [payments]);

  const handleUpdateStatus = useCallback(
    async (id: number, newStatus: string) => {
      const action =
        newStatus === "completed"
          ? "complete"
          : newStatus === "cancelled"
          ? "cancel"
          : "update";

      const confirmed = await showConfirm({
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} Payment`,
        message: `Are you sure you want to ${action} this payment?`,
        icon: "warning",
        confirmText: action.charAt(0).toUpperCase() + action.slice(1),
        cancelText: "Cancel",
      });
      if (!confirmed) return;

      try {
        showToast(`${action}ing payment...`, "info");
        const response = await paymentAPI.update(id, { status: newStatus });
        if (response.status) {
          showSuccess(`Payment ${action}d successfully`);
          fetchPayments();
        } else {
          throw new Error(response.message);
        }
      } catch (err: any) {
        showError(err.message || `Failed to ${action} payment`);
      }
    },
    [fetchPayments],
  );

  const handleProcessPayment = useCallback(
    async (id: number) => handleUpdateStatus(id, "completed"),
    [handleUpdateStatus],
  );

  const handleCancelPayment = useCallback(
    async (id: number) => handleUpdateStatus(id, "cancelled"),
    [handleUpdateStatus],
  );

  const handleGeneratePaymentSlip = useCallback(async () => {
    showToast("Payment slip generation is not yet implemented.", "info");
  }, []);

  return {
    handleDeletePayment,
    handleBulkDelete,
    handleExportCSV,
    handleUpdateStatus,
    handleProcessPayment,
    handleCancelPayment,
    handleGeneratePaymentSlip,
  };
};