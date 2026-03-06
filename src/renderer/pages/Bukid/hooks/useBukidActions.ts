// components/Bukid/hooks/useBukidActions.ts
import type { Bukid } from "../../../api/core/bukid";
import bukidAPI from "../../../api/core/bukid";
import { dialogs, showConfirm } from "../../../utils/dialogs";
import { showError, showSuccess, showToast } from "../../../utils/notification";

export const useBukidActions = (
  bukids: Bukid[],
  fetchBukids: () => Promise<void>,
  selectedBukids: number[] = []
) => {
  // Delete single bukid
  const handleDeleteBukid = async (id: number, name: string) => {
    const confirmed = await dialogs.delete(name);
    if (!confirmed) return;

    try {
      showToast("Deleting bukid...", "info");
      const response = await bukidAPI.delete(id);
      if (response.status) {
        showSuccess(`Bukid "${name}" deleted successfully`);
        fetchBukids();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || "Failed to delete bukid");
    }
  };

  // Update status (active/inactive) using update()
  const handleUpdateStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const action = newStatus === "active" ? "activate" : "deactivate";

    const confirmed = await showConfirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Bukid`,
      message: `Are you sure you want to ${action} this bukid?`,
      icon: "warning",
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      showToast(`${action}ing bukid...`, "info");
      const response = await bukidAPI.update(id, { status: newStatus });
      if (response.status) {
        showSuccess(`Bukid ${action}d successfully`);
        fetchBukids();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || `Failed to ${action} bukid`);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedBukids.length === 0) return;

    const confirmed = await showConfirm({
      title: "Bulk Delete Confirmation",
      message: `Are you sure you want to delete ${selectedBukids.length} selected bukid(s)? This action cannot be undone.`,
      icon: "danger",
      confirmText: "Delete All",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      showToast("Deleting selected bukid...", "info");
      const results = await Promise.allSettled(
        selectedBukids.map((id) => bukidAPI.delete(id))
      );
      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value.status
      );
      const failed = results.filter(
        (r) => r.status === "rejected" || !r.value?.status
      );

      if (failed.length === 0) {
        showSuccess(`Successfully deleted ${successful.length} bukid(s)`);
      } else {
        showError(
          `Deleted ${successful.length} bukid(s), failed to delete ${failed.length} bukid(s)`
        );
      }
      fetchBukids();
    } catch (err: any) {
      showError(err.message || "Failed to delete bukid");
    }
  };

  // Add/update note using update()
  const handleAddNote = async (id: number, note: string) => {
    try {
      showToast("Adding note...", "info");
      const response = await bukidAPI.update(id, { notes: note });
      if (response.status) {
        showSuccess("Note added successfully");
        fetchBukids();
        return true;
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || "Failed to add note");
      return false;
    }
  };

  // Mark as completed (set status to "completed")
  const handleOnBukidComplete = async (id: number) => {
    try {
      showToast("Completing bukid...", "info");
      const response = await bukidAPI.update(id, { status: "completed" });
      if (response.status) {
        showSuccess("Bukid marked as completed");
        fetchBukids();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || "Failed to complete bukid");
    }
  };

  return {
    handleDeleteBukid,
    handleUpdateStatus,
    handleBulkDelete,
    handleAddNote,
    handleOnBukidComplete,
  };
};