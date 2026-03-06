// src/renderer/pages/sessions/index.tsx
import React, { useState } from "react";
import { Plus, Download, Filter, RefreshCw, Calendar } from "lucide-react";
import { useSessions } from "./hooks/useSessions";
import sessionAPI from "../../api/core/session";
import Pagination from "../../components/Shared/Pagination";
import Button from "../../components/UI/Button";
import { dialogs } from "../../utils/dialogs";
import { showError, showSuccess } from "../../utils/notification";
import FilterBar from "./components/FilterBar";
import SessionFormDialog from "./components/SessionFormDialog";
import SessionsTable from "./components/SessionsTable";
import SessionViewDialog from "./components/SessionViewDialog";
import { useSessionForm } from "./hooks/useSessionForm";
import { useSessionView } from "./hooks/useSessionView";
import SessionNoteDialog from "./components/SessionNoteDialog";
import SessionViewNoteDialog from "./components/SessionViewNoteDialog";

const SessionsPage: React.FC = () => {
  const {
    sessions,
    allSessions,
    filters,
    loading,
    error,
    pagination,
    selectedSessions,
    setSelectedSessions,
    sortConfig,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload,
    handleFilterChange,
    resetFilters,
    toggleSessionSelection,
    toggleSelectAll,
    handleSort,
  } = useSessions();

  const formDialog = useSessionForm();
  const viewDialog = useSessionView();

  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "excel" | "pdf">("csv");

  // Note dialogs
  const [noteDialog, setNoteDialog] = useState<{
    isOpen: boolean;
    session: any | null;
  }>({ isOpen: false, session: null });

  const [viewNoteDialog, setViewNoteDialog] = useState<{
    isOpen: boolean;
    session: any | null;
  }>({ isOpen: false, session: null });

  // Handlers for dropdown actions
  const handleMarkActive = async (session: any) => {
    const confirmed = await dialogs.confirm({
      title: "Mark as Active",
      message: `Activate session "${session.name}"?`,
    });
    if (!confirmed) return;
    try {
      await sessionAPI.updateStatus(session.id, "active");
      showSuccess("Session marked as active.");
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleMarkClosed = async (session: any) => {
    const confirmed = await dialogs.confirm({
      title: "Mark as Closed",
      message: `Close session "${session.name}"?`,
    });
    if (!confirmed) return;
    try {
      await sessionAPI.updateStatus(session.id, "closed");
      showSuccess("Session marked as closed.");
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleMarkArchived = async (session: any) => {
    const confirmed = await dialogs.confirm({
      title: "Mark as Archived",
      message: `Archive session "${session.name}"?`,
    });
    if (!confirmed) return;
    try {
      await sessionAPI.updateStatus(session.id, "archived");
      showSuccess("Session archived.");
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleAddNote = (session: any) => {
    setNoteDialog({ isOpen: true, session });
  };

  const handleViewNote = (session: any) => {
    setViewNoteDialog({ isOpen: true, session });
  };

  const handleDelete = async (session: any) => {
    const confirmed = await dialogs.confirm({
      title: "Delete Session",
      message: `Are you sure you want to delete session "${session.name}"?`,
    });
    if (!confirmed) return;
    try {
      await sessionAPI.delete(session.id);
      showSuccess("Session deleted successfully.");
      reload();
    } catch (err: any) {
      dialogs.alert({ title: "Error", message: err.message });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSessions.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Bulk Delete",
      message: `Delete ${selectedSessions.length} sessions?`,
    });
    if (!confirmed) return;
    try {
      await Promise.all(selectedSessions.map((id) => sessionAPI.delete(id)));
      showSuccess(`${selectedSessions.length} sessions deleted.`);
      setSelectedSessions([]);
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleExport = async () => {
    if (allSessions.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Export Sessions",
      message: `Export ${pagination.total} sessions as ${exportFormat.toUpperCase()}?`,
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

  const activeCount = allSessions.filter((s) => s.status === "active").length;
  const closedCount = allSessions.filter((s) => s.status === "closed").length;
  const archivedCount = allSessions.filter((s) => s.status === "archived").length;

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
            Farm Sessions
          </h2>
          <p
            className="mt-xs text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Manage farming seasons and sessions
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
              disabled={exportLoading || allSessions.length === 0}
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
            Add Session
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
              {closedCount} Closed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              {archivedCount} Archived
            </span>
          </div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Total Sessions: {pagination.total}
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
      {selectedSessions.length > 0 && (
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
            {selectedSessions.length} session(s) selected
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
          <SessionsTable
            sessions={sessions}
            selectedSessions={selectedSessions}
            onToggleSelect={toggleSessionSelection}
            onToggleSelectAll={toggleSelectAll}
            onSort={handleSort}
            sortConfig={sortConfig}
            onView={(s) => viewDialog.open(s.id)}
            onEdit={formDialog.openEdit}
            onDelete={handleDelete}
            // New actions
            onMarkActive={handleMarkActive}
            onMarkClosed={handleMarkClosed}
            onMarkArchived={handleMarkArchived}
            onAddNote={handleAddNote}
            onViewNote={handleViewNote}
          />

          {/* Empty State */}
          {allSessions.length === 0 && (
            <div
              className="text-center py-8 border rounded-md"
              style={{ borderColor: "var(--border-color)" }}
            >
              <Calendar
                className="icon-xl mx-auto mb-2"
                style={{ color: "var(--text-secondary)" }}
              />
              <p className="text-base" style={{ color: "var(--sidebar-text)" }}>
                No sessions found.
              </p>
              <p
                className="mt-xs text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                {filters.search || filters.status !== "all" || filters.seasonType !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start by adding your first session"}
              </p>
              <div className="mt-2 gap-xs flex justify-center">
                {(filters.search || filters.status !== "all" || filters.seasonType !== "all") && (
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
                  Add First Session
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
      <SessionFormDialog
        isOpen={formDialog.isOpen}
        mode={formDialog.mode}
        sessionId={formDialog.sessionId}
        initialData={formDialog.initialData}
        onClose={formDialog.close}
        onSuccess={reload}
      />

      <SessionViewDialog hook={viewDialog} />

      <SessionNoteDialog
        isOpen={noteDialog.isOpen}
        session={noteDialog.session}
        onClose={() => setNoteDialog({ isOpen: false, session: null })}
        onSuccess={reload}
      />

      <SessionViewNoteDialog
        isOpen={viewNoteDialog.isOpen}
        session={viewNoteDialog.session}
        onClose={() => setViewNoteDialog({ isOpen: false, session: null })}
      />
    </div>
  );
};

export default SessionsPage;