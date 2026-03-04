// components/Assignment/hooks/useAssignmentActions.ts
import assignmentAPI from "../../../api/core/assignment";
import type { Assignment } from "../../../api/core/assignment";
import { showError, showSuccess, showToast } from "../../../utils/notification";
import { dialogs, showConfirm } from "../../../utils/dialogs";

export const useAssignmentActions = (
  assignments: Assignment[],
  refreshData: () => Promise<void>,
  selectedAssignments: number[],
  filters: {
    statusFilter: string;
    workerFilter: number | null;
    pitakFilter: number | null;
    dateFrom: string;
    dateTo: string;
  },
) => {
  // ---------- Delete single ----------
  const handleDeleteAssignment = async (id: number) => {
    const confirmed = await showConfirm({
      title: "Delete Assignment",
      message: `Are you sure you want to delete this assignment?`,
      icon: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      showToast("Deleting assignment...", "info");
      const response = await assignmentAPI.delete(id); // new method
      if (response.status) {
        showSuccess("Assignment deleted successfully");
        await refreshData();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || "Failed to delete assignment");
    }
  };

  // ---------- Update status (active/completed) ----------
  const handleUpdateStatus = async (id: number, currentStatus: string) => {
    // Determine new status: if active -> completed, else if completed -> active? But we keep logic from old code
    const newStatus = currentStatus === "active" ? "completed" : "active";
    const action = newStatus === "active" ? "activate" : "complete";

    const confirmed = await showConfirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Assignment`,
      message: `Are you sure you want to ${action} this assignment?`,
      icon: "warning",
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      showToast(`${action}ing assignment...`, "info");
      const response = await assignmentAPI.update(id, { status: newStatus }); // new method
      if (response.status) {
        showSuccess(`Assignment ${action}d successfully`);
        await refreshData();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || `Failed to ${action} assignment`);
    }
  };

  // ---------- Cancel (set status to cancelled) ----------
  const handleCancelAssignment = async (id: number) => {
    const confirmed = await showConfirm({
      title: "Cancel Assignment",
      message: "Are you sure you want to cancel this assignment?",
      icon: "warning",
      confirmText: "Cancel Assignment",
      cancelText: "Keep Active",
    });
    if (!confirmed) return;

    try {
      showToast("Cancelling assignment...", "info");
      const response = await assignmentAPI.update(id, {
        status: "cancelled",
        notes: "Cancelled by user",
      });
      if (response.status) {
        showSuccess("Assignment cancelled successfully");
        await refreshData();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || "Failed to cancel assignment");
    }
  };

  // ---------- Bulk delete ----------
  const handleBulkDelete = async () => {
    if (selectedAssignments.length === 0) return;

    const confirmed = await showConfirm({
      title: "Bulk Delete Confirmation",
      message: `Are you sure you want to delete ${selectedAssignments.length} selected assignment(s)? This action cannot be undone.`,
      icon: "danger",
      confirmText: "Delete All",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      showToast("Deleting selected assignments...", "info");
      const results = await Promise.allSettled(
        selectedAssignments.map((id) => assignmentAPI.delete(id))
      );
      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value.status
      );
      const failed = results.filter(
        (r) => r.status === "rejected" || !r.value?.status
      );

      if (failed.length === 0) {
        showSuccess(`Successfully deleted ${successful.length} assignment(s)`);
      } else {
        showError(
          `Deleted ${successful.length} assignment(s), failed to delete ${failed.length} assignment(s)`
        );
      }
      await refreshData();
    } catch (err: any) {
      showError(err.message || "Failed to delete assignments");
    }
  };

  // ---------- Export to CSV (manual generation) ----------
  const handleExportCSV = async () => {
    if (
      !(await dialogs.confirm({
        title: "Export Assignments to CSV",
        message: "Do you want to export the current filtered assignments to a CSV file?",
      }))
    )
      return;

    try {
      showToast("Exporting to CSV...", "info");

      // Build filter params for the API (same as used in fetch)
      const params: any = {};
      if (filters.statusFilter !== "all") params.status = filters.statusFilter;
      if (filters.workerFilter) params.workerId = filters.workerFilter;
      if (filters.pitakFilter) params.pitakId = filters.pitakFilter;
      if (filters.dateFrom) params.startDate = filters.dateFrom;
      if (filters.dateTo) params.endDate = filters.dateTo;

      const response = await assignmentAPI.getAll(params);
      if (!response.status) throw new Error(response.message);

      const data = response.data;
      if (!data.length) {
        showToast("No data to export", "warning");
        return;
      }

      // Convert to CSV
      const headers = ["ID", "Date", "Worker", "Pitak", "LuWang", "Status", "Notes"];
      const rows = data.map((a) => [
        a.id,
        a.assignmentDate,
        a.worker?.name || "",
        a.pitak?.location || "",
        a.luwangCount,
        a.status,
        a.notes || "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `assignments_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess(`Exported ${data.length} records to CSV`);
    } catch (err: any) {
      showError(err.message || "Failed to export CSV");
    }
  };

  return {
    handleDeleteAssignment,
    handleUpdateStatus,
    handleCancelAssignment,
    handleBulkDelete,
    handleExportCSV,
  };
};