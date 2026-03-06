// src/renderer/pages/workers/index.tsx
import React, { useState } from "react";
import { Plus, Download, Filter, RefreshCw, Users } from "lucide-react";
import { useWorkers } from "./hooks/useWorkers";
import workerAPI from "../../api/core/worker";
import Pagination from "../../components/Shared/Pagination";
import Button from "../../components/UI/Button";
import { dialogs } from "../../utils/dialogs";
import { showError, showSuccess } from "../../utils/notification";
import FilterBar from "./components/FilterBar";
import WorkerFormDialog from "./components/WorkerFormDialog";
import WorkersTable from "./components/WorkersTable";
import WorkerViewDialog from "./components/WorkerViewDialog";
import { useWorkerForm } from "./hooks/useWorkerForm";
import { useWorkerView } from "./hooks/useWorkerView";
import AssignmentFormDialog from "../assignments/components/AssignmentForm";
import { useAssignmentFormDialog } from "../assignments/components/AssignmentForm/hooks/useAssignmentFormDialog";

const WorkersPage: React.FC = () => {
  const {
    workers,
    allWorkers,
    filters,
    loading,
    error,
    pagination,
    selectedWorkers,
    setSelectedWorkers,
    sortConfig,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload,
    handleFilterChange,
    resetFilters,
    toggleWorkerSelection,
    toggleSelectAll,
    handleSort,
  } = useWorkers();

  const formDialog = useWorkerForm();
  const viewDialog = useWorkerView();
  const assignmentFormDialog = useAssignmentFormDialog();

  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "excel" | "pdf">("csv");

  // Status change handlers
  const handleMarkActive = async (worker: any) => {
    const confirmed = await dialogs.confirm({
      title: "Mark as Active",
      message: `Set worker "${worker.name}" status to Active?`,
    });
    if (!confirmed) return;
    try {
      await workerAPI.updateStatus(worker.id, "active");
      showSuccess("Worker marked as active.");
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleMarkInactive = async (worker: any) => {
    const confirmed = await dialogs.confirm({
      title: "Mark as Inactive",
      message: `Set worker "${worker.name}" status to Inactive?`,
    });
    if (!confirmed) return;
    try {
      await workerAPI.updateStatus(worker.id, "inactive");
      showSuccess("Worker marked as inactive.");
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleMarkOnLeave = async (worker: any) => {
    const confirmed = await dialogs.confirm({
      title: "Mark as On Leave",
      message: `Set worker "${worker.name}" status to On Leave?`,
    });
    if (!confirmed) return;
    try {
      await workerAPI.updateStatus(worker.id, "on-leave");
      showSuccess("Worker marked as on leave.");
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleMarkTerminated = async (worker: any) => {
    const confirmed = await dialogs.confirm({
      title: "Mark as Terminated",
      message: `Set worker "${worker.name}" status to Terminated?`,
    });
    if (!confirmed) return;
    try {
      await workerAPI.updateStatus(worker.id, "terminated");
      showSuccess("Worker terminated.");
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleDelete = async (worker: any) => {
    const confirmed = await dialogs.confirm({
      title: "Delete Worker",
      message: `Are you sure you want to delete worker "${worker.name}"?`,
    });
    if (!confirmed) return;
    try {
      await workerAPI.delete(worker.id);
      showSuccess("Worker deleted successfully.");
      reload();
    } catch (err: any) {
      dialogs.alert({ title: "Error", message: err.message });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedWorkers.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Bulk Delete",
      message: `Delete ${selectedWorkers.length} workers?`,
    });
    if (!confirmed) return;
    try {
      await Promise.all(selectedWorkers.map((id) => workerAPI.delete(id)));
      showSuccess(`${selectedWorkers.length} workers deleted.`);
      setSelectedWorkers([]);
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleExport = async () => {
    if (allWorkers.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Export Workers",
      message: `Export ${pagination.total} workers as ${exportFormat.toUpperCase()}?`,
    });
    if (!confirmed) return;
    setExportLoading(true);
    try {
      showSuccess("Export started (placeholder).");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const getDisplayRange = () => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, pagination.total);
    return { start, end };
  };
  const { start, end } = getDisplayRange();

  const activeCount = allWorkers.filter((w) => w.status === "active").length;
  const inactiveCount = allWorkers.filter((w) => w.status === "inactive").length;
  const onLeaveCount = allWorkers.filter((w) => w.status === "on-leave").length;
  const terminatedCount = allWorkers.filter((w) => w.status === "terminated").length;

  return (
    <div
      className="compact-card rounded-md shadow-md border"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--border-color)",
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm mb-4">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--sidebar-text)" }}>
            Workers
          </h2>
          <p className="mt-xs text-sm" style={{ color: "var(--text-secondary)" }}>
            Manage farm workers and their details
          </p>
        </div>
        <div className="flex flex-wrap gap-xs w-full sm:w-auto">
          <button
            className="compact-button rounded-md flex items-center transition-colors ease-in-out hover:scale-105 hover:shadow-md disabled:opacity-50"
            style={{
              backgroundColor: "var(--card-secondary-bg)",
              color: "var(--sidebar-text)",
            }}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="icon-sm mr-xs" />
            Filters {showFilters ? "↑" : "↓"}
          </button>
          <button
            onClick={reload}
            disabled={loading}
            className="btn btn-secondary btn-sm rounded-md flex items-center transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`icon-sm mr-1 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          {/* Export */}
          <div
            className="flex items-center gap-xs border rounded-md px-2 py-1"
            style={{
              backgroundColor: "var(--card-secondary-bg)",
              borderColor: "var(--border-color)",
            }}
          >
            <div className="flex items-center gap-1">
              <label className="text-xs" style={{ color: "var(--sidebar-text)" }}>
                Export:
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="text-xs border-none bg-transparent focus:ring-0 cursor-pointer"
                style={{ color: "var(--sidebar-text)" }}
              >
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
            <Button
              onClick={handleExport}
              disabled={exportLoading || allWorkers.length === 0}
              className="compact-button rounded-md flex items-center gap-1 px-2 py-1 text-xs"
            >
              <Download className="icon-xs" />
              {exportLoading ? "..." : "Export"}
            </Button>
          </div>

          <Button
            onClick={formDialog.openAdd}
            variant="success"
            size="sm"
            icon={Plus}
            iconPosition="left"
          >
            Add Worker
          </Button>
        </div>
      </div>

      {/* Summary Banner */}
      {pagination.total > 0 && (
        <div
          className="mb-4 compact-card rounded-md border p-3 flex flex-wrap items-center justify-between gap-2"
          style={{
            backgroundColor: "var(--card-secondary-bg)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              {activeCount} Active
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-500"></span>
              {inactiveCount} Inactive
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              {onLeaveCount} On Leave
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              {terminatedCount} Terminated
            </span>
          </div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Total Workers: {pagination.total}
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={resetFilters}
        />
      )}

      {/* Bulk Selection */}
      {selectedWorkers.length > 0 && (
        <div
          className="mb-2 compact-card rounded-md border flex items-center justify-between p-2"
          style={{
            backgroundColor: "var(--accent-blue-dark)",
            borderColor: "var(--accent-blue)",
          }}
        >
          <span className="font-medium text-sm" style={{ color: "var(--accent-green)" }}>
            {selectedWorkers.length} worker(s) selected
          </span>
          <div className="flex gap-xs">
            <button
              className="compact-button bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white rounded-md"
              onClick={handleBulkDelete}
              title="Delete selected"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Page Size & Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm mb-2">
        <div className="flex items-center gap-sm">
          <label className="text-sm" style={{ color: "var(--sidebar-text)" }}>
            Show:
          </label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="compact-input border rounded text-sm"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--border-color)",
              color: "var(--sidebar-text)",
            }}
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            entries
          </span>
        </div>
        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {pagination.total > 0 ? (
            <>
              Showing {start} to {end} of {pagination.total} entries
            </>
          ) : (
            "No entries found"
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-4">
          <div
            className="animate-spin rounded-full h-6 w-6 border-b-2"
            style={{ borderColor: "var(--accent-blue)" }}
          ></div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-4 text-red-500">Error: {error}</div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <WorkersTable
            workers={workers}
            selectedWorkers={selectedWorkers}
            onToggleSelect={toggleWorkerSelection}
            onToggleSelectAll={toggleSelectAll}
            onSort={handleSort}
            sortConfig={sortConfig}
            onView={(w) => viewDialog.open(w.id)}
            onEdit={formDialog.openEdit}
            onDelete={handleDelete}
            // Status change handlers
            onMarkActive={handleMarkActive}
            onMarkInactive={handleMarkInactive}
            onMarkOnLeave={handleMarkOnLeave}
            onMarkTerminated={handleMarkTerminated}
          />

          {/* Empty State */}
          {allWorkers.length === 0 && (
            <div
              className="text-center py-8 border rounded-md"
              style={{ borderColor: "var(--border-color)" }}
            >
              <Users className="icon-xl mx-auto mb-2" style={{ color: "var(--text-secondary)" }} />
              <p className="text-base" style={{ color: "var(--sidebar-text)" }}>
                No workers found.
              </p>
              <p className="mt-xs text-sm" style={{ color: "var(--text-tertiary)" }}>
                {filters.search || filters.status !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start by adding your first worker"}
              </p>
              <div className="mt-2 gap-xs flex justify-center">
                {(filters.search || filters.status !== "all") && (
                  <button
                    className="compact-button rounded-md"
                    style={{
                      backgroundColor: "var(--accent-blue)",
                      color: "white",
                    }}
                    onClick={resetFilters}
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  className="compact-button rounded-md"
                  style={{
                    backgroundColor: "var(--accent-green)",
                    color: "white",
                  }}
                  onClick={formDialog.openAdd}
                >
                  Add First Worker
                </button>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination.total > 0 && pagination.totalPages > 1 && (
            <div className="mt-2">
              <Pagination
                currentPage={currentPage}
                totalItems={pagination.total}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 25, 50, 100]}
                showPageSize={false}
              />
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <WorkerFormDialog
        isOpen={formDialog.isOpen}
        mode={formDialog.mode}
        workerId={formDialog.workerId}
        initialData={formDialog.initialData}
        onClose={formDialog.close}
        onSuccess={reload}
      />

      <WorkerViewDialog hook={viewDialog} />

      <AssignmentFormDialog
        isOpen={assignmentFormDialog.isOpen}
        workerIds={assignmentFormDialog.workerIds}
        pitakId={assignmentFormDialog.pitakId}
        isReassignment={assignmentFormDialog.isReassignment}
        reassignmentAssignmentId={assignmentFormDialog.reassignmentAssignmentId}
        onClose={assignmentFormDialog.close}
        onSuccess={reload}
      />
    </div>
  );
};

export default WorkersPage;