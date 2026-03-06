// src/renderer/pages/assignments/index.tsx
import React, { useState } from "react";
import { Plus, Download, Filter, RefreshCw, ClipboardList } from "lucide-react";
import { useAssignments } from "./hooks/useAssignments";
import assignmentAPI from "../../api/core/assignment";
import Pagination from "../../components/Shared/Pagination";
import Button from "../../components/UI/Button";
import { dialogs } from "../../utils/dialogs";
import { showError, showSuccess } from "../../utils/notification";
import AssignmentsTable from "./components/AssignmentsTable";
import AssignmentViewDialog from "./components/AssignmentViewDialog";
import FilterBar from "./components/FilterBar";
import AssignmentFormDialog from "./components/AssignmentForm";
import { useAssignmentFormDialog } from "./components/AssignmentForm/hooks/useAssignmentFormDialog";
import { useAssignmentView } from "./hooks/useAssignmentView";
import AssignmentViewNoteDialog from "./components/AssignmentViewNoteDialog";
import AssignmentNoteDialog from "./components/AssignmentNoteDialog";

const AssignmentsPage: React.FC = () => {
  const {
    assignments,
    allAssignments,
    filters,
    loading,
    error,
    pagination,
    selectedAssignments,
    setSelectedAssignments,
    sortConfig,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload,
    handleFilterChange,
    resetFilters,
    toggleAssignmentSelection,
    toggleSelectAll,
    handleSort,
  } = useAssignments();

  const formDialog = useAssignmentFormDialog();
  const viewDialog = useAssignmentView();

  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "excel" | "pdf">("csv");

  // Note dialogs
  const [noteDialog, setNoteDialog] = useState<{
    isOpen: boolean;
    assignment: any | null;
  }>({ isOpen: false, assignment: null });

  const [viewNoteDialog, setViewNoteDialog] = useState<{
    isOpen: boolean;
    assignment: any | null;
  }>({ isOpen: false, assignment: null });

  const handleDelete = async (assignment: any) => {
    const confirmed = await dialogs.confirm({
      title: "Delete Assignment",
      message: `Are you sure you want to delete assignment for worker "${assignment.worker?.name}"?`,
    });
    if (!confirmed) return;
    try {
      await assignmentAPI.delete(assignment.id);
      showSuccess("Assignment deleted successfully.");
      reload();
    } catch (err: any) {
      dialogs.alert({ title: "Error", message: err.message });
    }
  };

  const handleEdit = (assignment: any) => {
    // For assignment, only notes and date are editable via update API.
    // We open the note dialog (which also allows editing notes) – date could be added later.
    setNoteDialog({ isOpen: true, assignment });
  };

  const handleMarkCompleted = async (assignment: any) => {
    const confirmed = await dialogs.confirm({
      title: "Mark as Completed",
      message: `Complete assignment for worker "${assignment.worker?.name}"?`,
    });
    if (!confirmed) return;
    try {
      await assignmentAPI.updateStatus(assignment.id, "completed");
      showSuccess("Assignment marked as completed.");
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleMarkCancelled = async (assignment: any) => {
    const confirmed = await dialogs.confirm({
      title: "Mark as Cancelled",
      message: `Cancel assignment for worker "${assignment.worker?.name}"?`,
    });
    if (!confirmed) return;
    try {
      await assignmentAPI.updateStatus(assignment.id, "cancelled");
      showSuccess("Assignment cancelled.");
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleAddNote = (assignment: any) => {
    setNoteDialog({ isOpen: true, assignment });
  };

  const handleViewNote = (assignment: any) => {
    setViewNoteDialog({ isOpen: true, assignment });
  };

  const handleBulkDelete = async () => {
    if (selectedAssignments.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Bulk Delete",
      message: `Delete ${selectedAssignments.length} assignments?`,
    });
    if (!confirmed) return;
    try {
      await Promise.all(selectedAssignments.map((id) => assignmentAPI.delete(id)));
      showSuccess(`${selectedAssignments.length} assignments deleted.`);
      setSelectedAssignments([]);
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleExport = async () => {
    if (allAssignments.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Export Assignments",
      message: `Export ${pagination.total} assignments as ${exportFormat.toUpperCase()}?`,
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

  const activeCount = allAssignments.filter((a) => a.status === "active").length;
  const completedCount = allAssignments.filter((a) => a.status === "completed").length;
  const cancelledCount = allAssignments.filter((a) => a.status === "cancelled").length;

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
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--sidebar-text)" }}
          >
            Assignments
          </h2>
          <p
            className="mt-xs text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Manage worker assignments to pitaks
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
            <RefreshCw
              className={`icon-sm mr-1 ${loading ? "animate-spin" : ""}`}
            />
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
              <label
                className="text-xs"
                style={{ color: "var(--sidebar-text)" }}
              >
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
              disabled={exportLoading || allAssignments.length === 0}
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
            Add Assignment
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
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              {completedCount} Completed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              {cancelledCount} Cancelled
            </span>
          </div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Total Assignments: {pagination.total}
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
      {selectedAssignments.length > 0 && (
        <div
          className="mb-2 compact-card rounded-md border flex items-center justify-between p-2"
          style={{
            backgroundColor: "var(--accent-blue-dark)",
            borderColor: "var(--accent-blue)",
          }}
        >
          <span
            className="font-medium text-sm"
            style={{ color: "var(--accent-green)" }}
          >
            {selectedAssignments.length} assignment(s) selected
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
          <AssignmentsTable
            assignments={assignments}
            selectedAssignments={selectedAssignments}
            onToggleSelect={toggleAssignmentSelection}
            onToggleSelectAll={toggleSelectAll}
            onSort={handleSort}
            sortConfig={sortConfig}
            onView={(a) => viewDialog.open(a.id)}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onMarkCompleted={handleMarkCompleted}
            onMarkCancelled={handleMarkCancelled}
            onAddNote={handleAddNote}
            onViewNote={handleViewNote}
          />

          {/* Empty State */}
          {allAssignments.length === 0 && (
            <div
              className="text-center py-8 border rounded-md"
              style={{ borderColor: "var(--border-color)" }}
            >
              <ClipboardList
                className="icon-xl mx-auto mb-2"
                style={{ color: "var(--text-secondary)" }}
              />
              <p className="text-base" style={{ color: "var(--sidebar-text)" }}>
                No assignments found.
              </p>
              <p
                className="mt-xs text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                {Object.values(filters).some((v) => v && v !== "all" && v !== "")
                  ? "Try adjusting your search or filters"
                  : "Start by adding your first assignment"}
              </p>
              <div className="mt-2 gap-xs flex justify-center">
                {Object.values(filters).some((v) => v && v !== "all" && v !== "") && (
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
                  onClick={() => formDialog.openAdd([])}
                >
                  Add First Assignment
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
      <AssignmentFormDialog
        isOpen={formDialog.isOpen}
        onClose={formDialog.close}
        onSuccess={reload}
      />
      <AssignmentViewDialog hook={viewDialog} />

      <AssignmentNoteDialog
        isOpen={noteDialog.isOpen}
        assignment={noteDialog.assignment}
        onClose={() => setNoteDialog({ isOpen: false, assignment: null })}
        onSuccess={reload}
      />
      <AssignmentViewNoteDialog
        isOpen={viewNoteDialog.isOpen}
        assignment={viewNoteDialog.assignment}
        onClose={() => setViewNoteDialog({ isOpen: false, assignment: null })}
      />
    </div>
  );
};

export default AssignmentsPage;