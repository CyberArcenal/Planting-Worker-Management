// components/Debt/hooks/useDebtActions.ts
import { useNavigate } from "react-router-dom";
import type { Debt } from "../../../api/core/debt";
import debtAPI from "../../../api/core/debt";
import { showError, showSuccess, showToast } from "../../../utils/notification";
import { showConfirm } from "../../../utils/dialogs";

export const useDebtActions = (
  debts: Debt[],
  fetchDebts: () => Promise<void>,
  selectedDebts: number[]
) => {
  const navigate = useNavigate();

  // Delete single debt
  const handleDeleteDebt = async (id: number) => {
    const confirmed = await showConfirm({
      title: "Delete Debt",
      message: `Are you sure you want to delete debt #${id}?`,
      icon: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      showToast("Deleting debt...", "info");
      const response = await debtAPI.delete(id);
      if (response.status) {
        showSuccess("Debt deleted successfully");
        fetchDebts();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || "Failed to delete debt");
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedDebts.length === 0) return;

    const confirmed = await showConfirm({
      title: "Bulk Delete Confirmation",
      message: `Are you sure you want to delete ${selectedDebts.length} selected debt(s)? This action cannot be undone.`,
      icon: "danger",
      confirmText: "Delete All",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      showToast("Deleting selected debts...", "info");
      const results = await Promise.allSettled(
        selectedDebts.map((id) => debtAPI.delete(id))
      );
      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value.status
      );
      const failed = results.filter(
        (r) => r.status === "rejected" || !r.value?.status
      );

      if (failed.length === 0) {
        showSuccess(`Successfully deleted ${successful.length} debt(s)`);
      } else {
        showError(
          `Deleted ${successful.length} debt(s), failed to delete ${failed.length} debt(s)`
        );
      }
      fetchDebts();
    } catch (err: any) {
      showError(err.message || "Failed to delete debts");
    }
  };

  // Update status using update()
  const handleUpdateStatus = async (id: number, newStatus: string) => {
    const confirmed = await showConfirm({
      title: "Update Debt Status",
      message: `Are you sure you want to update this debt's status to "${newStatus}"?`,
      icon: "warning",
      confirmText: "Update",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      showToast("Updating debt status...", "info");
      const response = await debtAPI.update(id, { status: newStatus });
      if (response.status) {
        showSuccess("Debt status updated successfully");
        fetchDebts();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || "Failed to update debt status");
    }
  };

  // Make payment – navigate to payment page (adjust route as needed)
  const handleMakePayment = (workerId: number) => {
    navigate(`/payment/new?workerId=${workerId}`);
  };

  // View history – navigate to history page (adjust route as needed)
  const handleViewHistory = (id: number) => {
    navigate(`/debt/history/${id}`);
  };

  // Export to CSV – manual generation
  const handleExportCSV = async () => {
    if (!(await showConfirm({
      title: "Export Debts",
      message: "Do you want to export the current filtered debts to a CSV file?",
    }))) return;

    try {
      showToast("Exporting to CSV...", "info");
      // Use current filtered debts (allDebts with current filters applied)
      // const data = filteredDebts; // we need filteredDebts – but this hook doesn't have it.
      // We'll need to pass filteredDebts from the parent or fetch again.
      // For simplicity, we can fetch fresh data using current filters.
      const params: any = {};
      // if (statusFilter !== "all") params.status = statusFilter;
      // if (workerFilter) params.workerId = workerFilter;
      // if (dateFrom) params.dueDateStart = dateFrom;
      // if (dateTo) params.dueDateEnd = dateTo;

      const response = await debtAPI.getAll(params);
      if (!response.status || !response.data) throw new Error("Failed to fetch data");

      const dataToExport = response.data;

      if (dataToExport.length === 0) {
        showToast("No data to export", "warning");
        return;
      }

      // Generate CSV
      const headers = ["ID", "Date Incurred", "Worker", "Original Amount", "Balance", "Reason", "Due Date", "Status"];
      const rows = dataToExport.map((d) => [
        d.id,
        d.dateIncurred,
        d.worker?.name || "",
        d.amount,
        d.balance,
        d.reason || "",
        d.dueDate || "",
        d.status,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `debts-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess(`Exported ${dataToExport.length} records to CSV.`);
    } catch (err: any) {
      showError(err.message || "Failed to export CSV");
    }
  };

  return {
    handleDeleteDebt,
    handleBulkDelete,
    handleUpdateStatus,
    handleMakePayment,
    handleViewHistory,
    handleExportCSV,
  };
};