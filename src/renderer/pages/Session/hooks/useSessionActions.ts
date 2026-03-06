// components/Session/hooks/useSessionActions.ts
import type { Session } from "../../../api/core/session";
import sessionAPI from "../../../api/core/session";
import { dialogs, showConfirm } from "../../../utils/dialogs";
import { showError, showSuccess, showToast } from "../../../utils/notification";

export const useSessionActions = (
  sessions: Session[],
  fetchSessions: () => Promise<void>,
  selectedSessions: number[] = [],
) => {
  const handleDeleteSession = async (id: number) => {
    const session = sessions.find((s) => s.id === id);
    const confirmed = await showConfirm({
      title: "Delete Session",
      message: `Are you sure you want to delete "${session?.name}"? This will also delete all associated bukids and assignments.`,
      icon: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      showToast("Deleting session...", "info");
      const response = await sessionAPI.delete(id);
      if (response.status) {
        showSuccess("Session deleted successfully");
        fetchSessions();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || "Failed to delete session");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSessions.length === 0) return;

    const confirmed = await showConfirm({
      title: "Bulk Delete Confirmation",
      message: `Are you sure you want to delete ${selectedSessions.length} selected session(s)? This action cannot be undone.`,
      icon: "danger",
      confirmText: "Delete All",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      showToast("Deleting selected sessions...", "info");
      const results = await Promise.allSettled(
        selectedSessions.map((id) => sessionAPI.delete(id))
      );
      const successful = results.filter((r) => r.status === "fulfilled" && r.value.status).length;
      const failed = results.filter((r) => r.status === "rejected" || !r.value?.status).length;
      if (failed === 0) {
        showSuccess(`Successfully deleted ${successful} session(s)`);
      } else {
        showError(`Deleted ${successful} session(s), failed to delete ${failed} session(s)`);
      }
      fetchSessions();
    } catch (err: any) {
      showError(err.message || "Failed to delete sessions");
    }
  };

  const handleExportCSV = async () => {
    if (!(await dialogs.confirm({ title: "Export Data", message: "Export sessions to CSV?" }))) return;
    try {
      showToast("Exporting to CSV...", "info");
      // Use current filtered sessions (allSessions) to export
      const data = sessions; // paginated, but we can export all if needed – better to use allSessions
      if (data.length === 0) {
        showToast("No data to export", "warning");
        return;
      }
      const headers = ["ID", "Name", "Year", "Season Type", "Start Date", "End Date", "Status", "Bukids", "Assignments"];
      const rows = data.map((s) => [
        s.id,
        s.name,
        s.year,
        s.seasonType || "",
        s.startDate,
        s.endDate || "",
        s.status,
        s.bukids?.length || 0,
        s.assignments?.length || 0,
      ]);
      const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sessions-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess(`Exported ${data.length} records to CSV`);
    } catch (err: any) {
      showError(err.message || "Failed to export CSV");
    }
  };

  const handleCloseSession = async (id: number) => {
    const session = sessions.find((s) => s.id === id);
    const confirmed = await showConfirm({
      title: "Close Session",
      message: `Are you sure you want to close "${session?.name}"?`,
      icon: "warning",
      confirmText: "Close",
      cancelText: "Cancel",
    });
    if (!confirmed) return;
    try {
      showToast("Closing session...", "info");
      const response = await sessionAPI.update(id, { status: "closed" });
      if (response.status) {
        showSuccess("Session closed successfully");
        fetchSessions();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || "Failed to close session");
    }
  };

  const handleArchiveSession = async (id: number) => {
    const session = sessions.find((s) => s.id === id);
    const confirmed = await showConfirm({
      title: "Archive Session",
      message: `Are you sure you want to archive "${session?.name}"?`,
      icon: "warning",
      confirmText: "Archive",
      cancelText: "Cancel",
    });
    if (!confirmed) return;
    try {
      showToast("Archiving session...", "info");
      const response = await sessionAPI.update(id, { status: "archived" });
      if (response.status) {
        showSuccess("Session archived successfully");
        fetchSessions();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || "Failed to archive session");
    }
  };

  const handleActivateSession = async (id: number) => {
    const session = sessions.find((s) => s.id === id);
    const confirmed = await showConfirm({
      title: "Activate Session",
      message: `Are you sure you want to activate "${session?.name}"?`,
      icon: "info",
      confirmText: "Activate",
      cancelText: "Cancel",
    });
    if (!confirmed) return;
    try {
      showToast("Activating session...", "info");
      const response = await sessionAPI.update(id, { status: "active" });
      if (response.status) {
        showSuccess("Session activated successfully");
        fetchSessions();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || "Failed to activate session");
    }
  };

  const handleDuplicateSession = async (id: number, newName?: string) => {
    const original = sessions.find((s) => s.id === id);
    if (!original) return;

    const name = newName || (await dialogs.prompt({
      title: "Duplicate Session",
      message: `Enter name for duplicated session (${original.name}):`,
      defaultValue: `${original.name} - Copy`,
    }));
    if (!name || name.trim() === "") {
      showError("Session name is required");
      return;
    }

    const confirmed = await showConfirm({
      title: "Duplicate Session",
      message: `Create a new session "${name}" based on "${original.name}"?`,
      icon: "info",
      confirmText: "Duplicate",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      showToast("Duplicating session...", "info");
      // Create new session with same properties (except dates maybe)
      const createData = {
        name: name.trim(),
        year: original.year,
        startDate: original.startDate,
        endDate: original.endDate as string | undefined,
        seasonType: original.seasonType as string | undefined,
        status: "active" as string | undefined, // default to active
      };
      const response = await sessionAPI.create(createData);
      if (response.status) {
        showSuccess("Session duplicated successfully");
        fetchSessions();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || "Failed to duplicate session");
    }
  };

  return {
    handleDeleteSession,
    handleBulkDelete,
    handleExportCSV,
    handleCloseSession,
    handleArchiveSession,
    handleActivateSession,
    handleDuplicateSession,
  };
};