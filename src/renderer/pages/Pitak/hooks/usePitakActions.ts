// components/Pitak/hooks/usePitakActions.ts
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Pitak } from "../../../api/core/pitak";
import { showConfirm } from "../../../utils/dialogs";
import { showError, showSuccess, showToast } from "../../../utils/notification";
import pitakAPI from "../../../api/core/pitak";
import assignmentAPI from "../../../api/core/assignment";

export interface AssignmentDialogData {
  pitakId: number;
  workers: any[]; // workers array with id, name
  assignmentDate: string;
  notes?: string;
}

export interface BulkOperationData {
  workerIds: number[];
  assignmentDate: string;
  luwangCount: number;
  notes?: string;
}

export interface LuWangUpdateData {
  pitakId: number;
  totalLuwang: number;
  adjustmentType: "add" | "subtract" | "set";
  notes?: string;
}

export const usePitakActions = (
  pitaks: Pitak[],
  fetchPitaks: () => Promise<void>,
) => {
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectPitakId, setSelectPitakId] = useState<number | null>(null);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [showLuWangUpdateDialog, setShowLuWangUpdateDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const [showSingleAssignmentDialog, setShowSingleAssignmentDialog] = useState(false);
  const [showMultipleAssignmentsDialog, setShowMultipleAssignmentsDialog] = useState(false);
  const [showAssignmentHistoryDialog, setShowAssignmentHistoryDialog] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number>(0);
  const [selectedPitakId, setSelectedPitakId] = useState<number>(0);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedViewPitakId, setSelectedViewPitakId] = useState<number | null>(null);
  const [showAssignedWorkersDialog, setShowAssignedWorkersDialog] = useState(false);
  const [selectedPitakForWorkers, setSelectedPitakForWorkers] = useState<{ id: number; location?: string } | null>(null);

  const [assignmentData, setAssignmentData] = useState<AssignmentDialogData>({
    pitakId: 0,
    workers: [],
    assignmentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [bulkOperationData, setBulkOperationData] = useState<BulkOperationData>({
    workerIds: [],
    assignmentDate: new Date().toISOString().split("T")[0],
    luwangCount: 0,
    notes: "",
  });

  const [luwangUpdateData, setLuWangUpdateData] = useState<LuWangUpdateData>({
    pitakId: 0,
    totalLuwang: 0,
    adjustmentType: "set",
    notes: "",
  });

  const openCreateDialog = () => {
    setDialogMode("add");
    setSelectPitakId(null);
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (id: number) => {
    setDialogMode("edit");
    setSelectPitakId(id);
    setIsFormDialogOpen(true);
  };

  const closeFormDialog = () => {
    setIsFormDialogOpen(false);
    setSelectPitakId(null);
  };

  const handleCreatePitak = () => openCreateDialog();

  const handleViewPitak = (id: number) => {
    setSelectedViewPitakId(id);
    setShowViewDialog(true);
  };

  const handleEditPitak = (id: number) => openEditDialog(id);

  const handleViewAssignmentDialog = (assignmentId: number) => {
    setSelectedAssignmentId(assignmentId);
    setShowSingleAssignmentDialog(true);
  };

  const handleViewPitakAssignmentsDialog = (pitakId: number) => {
    setSelectedPitakId(pitakId);
    setShowMultipleAssignmentsDialog(true);
  };

  const handleViewAssignmentHistoryDialog = (assignmentId: number) => {
    setSelectedAssignmentId(assignmentId);
    setShowAssignmentHistoryDialog(true);
  };

  const handleDeletePitak = async (id: number, location?: string) => {
    const confirmed = await showConfirm({
      title: "Delete Pitak",
      message: `Are you sure you want to delete this pitak ${location ? `at ${location}` : ""}?`,
      icon: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      showToast("Deleting pitak...", "info");
      const response = await pitakAPI.delete(id);
      if (response.status) {
        showSuccess("Pitak deleted successfully");
        fetchPitaks();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || "Failed to delete pitak");
    }
  };

  const handleAssignWorker = (pitakId: number, pitakData?: any) => {
    setAssignmentData({
      pitakId,
      workers: [],
      assignmentDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setShowAssignmentDialog(true);
  };

  const handleSubmitAssignment = async () => {
    if (!assignmentData.workers || assignmentData.workers.length === 0) {
      showError("Please select at least one worker");
      return;
    }

    try {
      showToast(`Creating assignments for ${assignmentData.workers.length} workers...`, "info");

      const sessionId = 1; // TODO: get from systemConfig

      const results = await Promise.all(
        assignmentData.workers.map((worker) =>
          assignmentAPI.create({
            workerId: worker.id,
            pitakId: assignmentData.pitakId,
            sessionId,
            luwangCount: 1,
            assignmentDate: assignmentData.assignmentDate,
            notes: assignmentData.notes,
            status: "active",
          })
        )
      );

      const successCount = results.filter(r => r.status).length;
      showSuccess(`Successfully created ${successCount} assignment(s)`);

      setShowAssignmentDialog(false);
      fetchPitaks();
    } catch (err: any) {
      showError(err.message || "Failed to create assignments");
    }
  };

  const handleUpdateLuWang = (pitakId: number, totalLuwang: number) => {
    setLuWangUpdateData({
      pitakId,
      totalLuwang,
      adjustmentType: "set",
      notes: "",
    });
    setShowLuWangUpdateDialog(true);
  };

  const handleSubmitLuWangUpdate = async () => {
    try {
      showToast("Updating luwang capacity...", "info");
      const response = await pitakAPI.update(luwangUpdateData.pitakId, {
        totalLuwang: luwangUpdateData.totalLuwang,
      });
      if (response.status) {
        showSuccess("LuWang capacity updated successfully");
        setShowLuWangUpdateDialog(false);
        fetchPitaks();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || "Failed to update luwang capacity");
    }
  };

  const handleBulkAssign = (selectedPitaks: number[]) => {
    if (selectedPitaks.length === 0) {
      showError("Please select at least one pitak");
      return;
    }
    setBulkOperationData({
      workerIds: [],
      assignmentDate: new Date().toISOString().split("T")[0],
      luwangCount: 0,
      notes: "",
    });
    setShowBulkAssignDialog(true);
  };

  const handleSubmitBulkAssign = async (selectedPitaks: number[], data: BulkOperationData) => {
    if (!data.workerIds || data.workerIds.length === 0) {
      showError("Please select at least one worker");
      return;
    }
    if (data.luwangCount <= 0) {
      showError("Please enter a valid luwang count");
      return;
    }

    try {
      showToast(`Creating assignments for ${selectedPitaks.length} pitaks...`, "info");

      const sessionId = 1; // TODO: get from systemConfig

      const results = await Promise.all(
        selectedPitaks.flatMap(pitakId =>
          data.workerIds.map(workerId =>
            assignmentAPI.create({
              workerId,
              pitakId,
              sessionId,
              luwangCount: data.luwangCount,
              assignmentDate: data.assignmentDate,
              notes: data.notes,
              status: "active",
            })
          )
        )
      );

      const successCount = results.filter(r => r.status).length;
      showSuccess(`Created ${successCount} assignments successfully`);

      setShowBulkAssignDialog(false);
      fetchPitaks();
    } catch (err: any) {
      showError(err.message || "Failed to create bulk assignments");
    }
  };

  const handleBulkStatusChange = async (status: "active" | "inactive" | "completed", selectedPitaks: number[]) => {
    if (selectedPitaks.length === 0) {
      showError("Please select at least one pitak");
      return;
    }

    const action = status === "active" ? "activate" : status === "inactive" ? "deactivate" : "mark as completed";

    const confirmed = await showConfirm({
      title: `Bulk ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      message: `Are you sure you want to ${action} ${selectedPitaks.length} selected pitak(s)?`,
      icon: "warning",
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      showToast(`${action}ing ${selectedPitaks.length} pitaks...`, "info");
      const results = await Promise.allSettled(
        selectedPitaks.map((id) => pitakAPI.update(id, { status }))
      );
      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;
      if (failed === 0) {
        showSuccess(`Successfully ${action}d ${successful} pitak(s)`);
      } else {
        showError(`${action}d ${successful} pitak(s), failed to ${action} ${failed} pitak(s)`);
      }
      fetchPitaks();
    } catch (err: any) {
      showError(err.message || `Failed to ${action} pitaks`);
    }
  };

  const handleBulkDelete = async (selectedPitaks: number[]) => {
    if (selectedPitaks.length === 0) {
      showError("Please select at least one pitak to delete");
      return;
    }

    const selectedDetails = pitaks
      .filter(p => selectedPitaks.includes(p.id))
      .map(p => p.location || `Pitak #${p.id}`);

    const confirmed = await showConfirm({
      title: "Bulk Delete Confirmation",
      message: `Are you sure you want to delete ${selectedPitaks.length} selected pitak(s)?\n\nSelected: ${selectedDetails.join(", ")}`,
      icon: "danger",
      confirmText: "Delete All",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      showToast(`Deleting ${selectedPitaks.length} pitaks...`, "info");
      const results = await Promise.allSettled(
        selectedPitaks.map((id) => pitakAPI.delete(id))
      );
      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;
      if (failed === 0) {
        showSuccess(`Successfully deleted ${successful} pitak(s)`);
      } else {
        showError(`Deleted ${successful} pitak(s), failed to delete ${failed} pitak(s)`);
      }
      fetchPitaks();
    } catch (err: any) {
      showError(err.message || "Failed to delete pitaks");
    }
  };

  const handleExport = async (format: "csv" | "pdf" = "csv") => {
    if (format === "csv") {
      showToast("Export to CSV not yet implemented in this refactor.", "info");
    } else {
      showError("PDF export not yet implemented");
    }
  };

  const handleViewAssignedWorkers = (pitakId: number, location?: string) => {
    setSelectedPitakForWorkers({ id: pitakId, location });
    setShowAssignedWorkersDialog(true);
  };

  const handleMarkAsHarvested = async (id: number, location?: string) => {
    const confirmed = await showConfirm({
      title: "Mark as Completed",
      message: `Are you sure you want to mark "${location || "this pitak"}" as completed?`,
      icon: "warning",
      confirmText: "Mark as Completed",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      showToast("Marking pitak as completed...", "info");
      const response = await pitakAPI.update(id, { status: "completed" });
      if (response.status) {
        showSuccess("Pitak marked as completed successfully");
        fetchPitaks();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || "Failed to mark pitak as completed");
    }
  };

  const handleUpdatePitakStatus = async (id: number, currentStatus: string, location?: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const action = newStatus === "active" ? "activate" : "deactivate";

    const confirmed = await showConfirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Pitak`,
      message: `Are you sure you want to ${action} "${location || "this pitak"}"?`,
      icon: "warning",
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      showToast(`${action}ing pitak...`, "info");
      const response = await pitakAPI.update(id, { status: newStatus });
      if (response.status) {
        showSuccess(`Pitak ${action}d successfully`);
        fetchPitaks();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || `Failed to ${action} pitak`);
    }
  };

  return {
    showAssignmentDialog,
    setShowAssignmentDialog,
    showBulkAssignDialog,
    setShowBulkAssignDialog,
    showLuWangUpdateDialog,
    setShowLuWangUpdateDialog,
    showExportDialog,
    setShowExportDialog,
    assignmentData,
    setAssignmentData,
    bulkOperationData,
    setBulkOperationData,
    luwangUpdateData,
    setLuWangUpdateData,
    handleCreatePitak,
    handleViewPitak,
    handleEditPitak,
    handleDeletePitak,
    handleAssignWorker,
    handleSubmitAssignment,
    handleUpdateLuWang,
    handleSubmitLuWangUpdate,
    handleBulkAssign,
    handleSubmitBulkAssign,
    handleBulkStatusChange,
    handleBulkDelete,
    handleExport,
    handleViewAssignedWorkers,
    handleMarkAsHarvested,
    handleUpdatePitakStatus,

    handleViewAssignmentDialog,
    handleViewPitakAssignmentsDialog,
    handleViewAssignmentHistoryDialog,
    showSingleAssignmentDialog,
    setShowSingleAssignmentDialog,
    showMultipleAssignmentsDialog,
    setShowMultipleAssignmentsDialog,
    showAssignmentHistoryDialog,
    setShowAssignmentHistoryDialog,
    selectedAssignmentId,
    setSelectedAssignmentId,
    selectedPitakId,
    setSelectedPitakId,

    isFormDialogOpen,
    openCreateDialog,
    openEditDialog,
    closeFormDialog,
    selectPitakId,
    dialogMode,
    setIsFormDialogOpen,
    setSelectPitakId,
    setDialogMode,

    showViewDialog,
    setShowViewDialog,
    selectedViewPitakId,
    setSelectedViewPitakId,

    showAssignedWorkersDialog,
    setShowAssignedWorkersDialog,
    selectedPitakForWorkers,
    setSelectedPitakForWorkers,
  };
};