// src/renderer/pages/bukid/index.tsx
import React, { useState } from "react";
import { Plus, Download, Filter, RefreshCw, Map } from "lucide-react";
import { useBukids } from "./hooks/useBukids";
import { useBukidForm } from "./hooks/useBukidForm";
import { useBukidView } from "./hooks/useBukidView";
import FilterBar from "./components/FilterBar";
import BukidsTable from "./components/BukidsTable";
import BukidFormDialog from "./components/BukidFormDialog";
import BukidViewDialog from "./components/BukidViewDialog";
import BukidNoteDialog from "./components/BukidNoteDialog";
import BukidViewNoteDialog from "./components/BukidViewNoteDialog";
import { dialogs } from "../../utils/dialogs";
import bukidAPI from "../../api/core/bukid";
import { showError, showInfo, showSuccess } from "../../utils/notification";
import Button from "../../components/UI/Button";
import Pagination from "../../components/Shared/Pagination";
import { usePitakForm } from "../pitak/components/pitakFormDialog/hooks/usePitakForm";
import PitakFormDialog from "../pitak/components/pitakFormDialog";

const BukidPage: React.FC = () => {
  const {
    bukids,
    allBukids,
    filters,
    loading,
    error,
    pagination,
    selectedBukids,
    setSelectedBukids,
    sortConfig,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload,
    handleFilterChange,
    resetFilters,
    toggleBukidSelection,
    toggleSelectAll,
    handleSort,
  } = useBukids();

  const formDialog = useBukidForm();
  const viewDialog = useBukidView();
  const pitakForm = usePitakForm();

  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "excel" | "pdf">(
    "csv",
  );

  // Note dialogs
  const [noteDialog, setNoteDialog] = useState<{
    isOpen: boolean;
    bukid: any | null;
  }>({ isOpen: false, bukid: null });

  const [viewNoteDialog, setViewNoteDialog] = useState<{
    isOpen: boolean;
    bukid: any | null;
  }>({ isOpen: false, bukid: null });

  const handleDelete = async (bukid: any) => {
    const confirmed = await dialogs.confirm({
      title: "Delete Bukid",
      message: `Are you sure you want to delete bukid "${bukid.name}"?`,
    });
    if (!confirmed) return;
    try {
      await bukidAPI.delete(bukid.id);
      showInfo("Bukid deleted successfully.");
      reload();
    } catch (err: any) {
      dialogs.alert({ title: "Error", message: err.message });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBukids.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Bulk Delete",
      message: `Delete ${selectedBukids.length} bukids?`,
    });
    if (!confirmed) return;
    try {
      await Promise.all(selectedBukids.map((id) => bukidAPI.delete(id)));
      showSuccess(`${selectedBukids.length} bukids deleted.`);
      setSelectedBukids([]);
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  // Add Plot handler
  const handleAddPlot = (bukid: any) => {
    pitakForm.openAddWithBukid(bukid.id);
  };

  // Add Note handler
  const handleAddNote = (bukid: any) => {
    setNoteDialog({ isOpen: true, bukid });
  };

  // View Note handler
  const handleViewNote = (bukid: any) => {
    setViewNoteDialog({ isOpen: true, bukid });
  };

  // Mark as Complete
  const handleMarkComplete = async (bukid: any) => {
    const confirmed = await dialogs.confirm({
      title: "Mark as Complete",
      message: `Are you sure you want to mark bukid "${bukid.name}" as complete?`,
    });
    if (!confirmed) return;
    try {
      await bukidAPI.updateStatus(bukid.id, "completed");
      showSuccess("Bukid marked as complete.");
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  // Mark as Cancelled (inactive)
  const handleMarkCancelled = async (bukid: any) => {
    const confirmed = await dialogs.confirm({
      title: "Mark as Cancelled",
      message: `Are you sure you want to mark bukid "${bukid.name}" as cancelled?`,
    });
    if (!confirmed) return;
    try {
      await bukidAPI.updateStatus(bukid.id, "inactive");
      showSuccess("Bukid marked as cancelled.");
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleExport = async () => {
    if (allBukids.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Export Bukids",
      message: `Export ${pagination.total} bukids as ${exportFormat.toUpperCase()}?`,
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

  // Summary stats
  const activeCount = allBukids.filter((b) => b.status === "active").length;
  const inactiveCount = allBukids.filter((b) => b.status === "inactive").length;
  const completeCount = allBukids.filter(
    (b) => b.status === "completed",
  ).length;
  const initiatedCount = allBukids.filter(
    (b) => b.status === "initiated",
  ).length;

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
            Bukid
          </h2>
          <p
            className="mt-xs text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Manage farm lands and their details
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
              disabled={exportLoading || allBukids.length === 0}
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
            Add Bukid
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
              {initiatedCount} Initiated
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              {completeCount} Complete
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-500"></span>
              {inactiveCount} Inactive
            </span>
          </div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Total Bukids: {pagination.total}
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
      {selectedBukids.length > 0 && (
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
            {selectedBukids.length} bukid(s) selected
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
          <BukidsTable
            bukids={bukids}
            selectedBukids={selectedBukids}
            onToggleSelect={toggleBukidSelection}
            onToggleSelectAll={toggleSelectAll}
            onSort={handleSort}
            sortConfig={sortConfig}
            onView={(b) => viewDialog.open(b.id)}
            onEdit={formDialog.openEdit}
            onDelete={handleDelete}
            onAddPlot={handleAddPlot}
            onAddNote={handleAddNote}
            onViewNote={handleViewNote}
            onMarkComplete={handleMarkComplete}
            onMarkCancelled={handleMarkCancelled}
          />

          {/* Empty State */}
          {allBukids.length === 0 && (
            <div
              className="text-center py-8 border rounded-md"
              style={{ borderColor: "var(--border-color)" }}
            >
              <Map
                className="icon-xl mx-auto mb-2"
                style={{ color: "var(--text-secondary)" }}
              />
              <p className="text-base" style={{ color: "var(--sidebar-text)" }}>
                No bukids found.
              </p>
              <p
                className="mt-xs text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                {Object.values(filters).some((v) => v && v !== "all")
                  ? "Try adjusting your search or filters"
                  : "Start by adding your first bukid"}
              </p>
              <div className="mt-2 gap-xs flex justify-center">
                {Object.values(filters).some((v) => v && v !== "all") && (
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
                  Add First Bukid
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
      <BukidFormDialog
        isOpen={formDialog.isOpen}
        mode={formDialog.mode}
        bukidId={formDialog.bukidId}
        initialData={formDialog.initialData}
        onClose={formDialog.close}
        onSuccess={reload}
      />

      <BukidViewDialog hook={viewDialog} />

      <PitakFormDialog
        isOpen={pitakForm.isOpen}
        mode="add"
        bukidId={pitakForm.bukidId}
        onClose={pitakForm.close}
        onSuccess={reload}
      />

      <BukidNoteDialog
        isOpen={noteDialog.isOpen}
        bukid={noteDialog.bukid}
        onClose={() => setNoteDialog({ isOpen: false, bukid: null })}
        onSuccess={reload}
      />

      <BukidViewNoteDialog
        isOpen={viewNoteDialog.isOpen}
        bukid={viewNoteDialog.bukid}
        onClose={() => setViewNoteDialog({ isOpen: false, bukid: null })}
      />
    </div>
  );
};

export default BukidPage;
