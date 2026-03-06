// src/renderer/pages/debt-history/index.tsx
import React, { useState } from "react";
import { Download, Filter, RefreshCw, History } from "lucide-react";
import { useDebtHistories } from "./hooks/useDebtHistories";
import debtHistoryAPI from "../../api/core/debt_history";
import Pagination from "../../components/Shared/Pagination";
import Button from "../../components/UI/Button";
import { dialogs } from "../../utils/dialogs";
import { showError, showSuccess } from "../../utils/notification";
import DebtHistoriesTable from "./components/DebtHistoriesTable";
import DebtHistoryViewDialog from "./components/DebtHistoryViewDialog";
import FilterBar from "./components/FilterBar";
import { useDebtHistoryView } from "./hooks/useDebtHistoryView";
import DebtHistoryNoteDialog from "./components/DebtHistoryNoteDialog";
import DebtHistoryViewNoteDialog from "./components/DebtHistoryViewNoteDialog";

const DebtHistoryPage: React.FC = () => {
  const {
    histories,
    allHistories,
    filters,
    loading,
    error,
    pagination,
    selectedHistories,
    setSelectedHistories,
    sortConfig,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload,
    handleFilterChange,
    resetFilters,
    toggleHistorySelection,
    toggleSelectAll,
    handleSort,
  } = useDebtHistories();

  const viewDialog = useDebtHistoryView();

  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "excel" | "pdf">("csv");

  // Note dialogs
  const [noteDialog, setNoteDialog] = useState<{
    isOpen: boolean;
    history: any | null;
  }>({ isOpen: false, history: null });

  const [viewNoteDialog, setViewNoteDialog] = useState<{
    isOpen: boolean;
    history: any | null;
  }>({ isOpen: false, history: null });

  // Handlers for dropdown actions
  const handleEdit = (history: any) => {
    // For now, we can open the note dialog (since editing might just be notes)
    setNoteDialog({ isOpen: true, history });
  };

  const handleAddNote = (history: any) => {
    setNoteDialog({ isOpen: true, history });
  };

  const handleViewNote = (history: any) => {
    setViewNoteDialog({ isOpen: true, history });
  };

  const handleDelete = async (history: any) => {
    const confirmed = await dialogs.confirm({
      title: "Delete Debt History",
      message: `Are you sure you want to delete this history entry (ID: ${history.id})?`,
    });
    if (!confirmed) return;
    try {
      await debtHistoryAPI.delete(history.id);
      showSuccess("Debt history deleted successfully.");
      reload();
    } catch (err: any) {
      dialogs.alert({ title: "Error", message: err.message });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedHistories.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Bulk Delete",
      message: `Delete ${selectedHistories.length} history entries?`,
    });
    if (!confirmed) return;
    try {
      await Promise.all(selectedHistories.map((id) => debtHistoryAPI.delete(id)));
      showSuccess(`${selectedHistories.length} entries deleted.`);
      setSelectedHistories([]);
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleExport = async () => {
    if (allHistories.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Export Debt History",
      message: `Export ${pagination.total} entries as ${exportFormat.toUpperCase()}?`,
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

  return (
    <div
      className="compact-card rounded-md shadow-md border"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--border-color)",
      }}
    >
      {/* Header (unchanged) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm mb-4">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--sidebar-text)" }}>
            Debt History
          </h2>
          <p className="mt-xs text-sm" style={{ color: "var(--text-secondary)" }}>
            Track all payments and changes on debts
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
              disabled={exportLoading || allHistories.length === 0}
              className="compact-button rounded-md flex items-center gap-1 px-2 py-1 text-xs"
            >
              <Download className="icon-xs" />
              {exportLoading ? "..." : "Export"}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={resetFilters}
        />
      )}

      {/* Bulk Selection */}
      {selectedHistories.length > 0 && (
        <div
          className="mb-2 compact-card rounded-md border flex items-center justify-between p-2"
          style={{
            backgroundColor: "var(--accent-blue-dark)",
            borderColor: "var(--accent-blue)",
          }}
        >
          <span className="font-medium text-sm" style={{ color: "var(--accent-green)" }}>
            {selectedHistories.length} entry(ies) selected
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
          <DebtHistoriesTable
            histories={histories}
            selectedHistories={selectedHistories}
            onToggleSelect={toggleHistorySelection}
            onToggleSelectAll={toggleSelectAll}
            onSort={handleSort}
            sortConfig={sortConfig}
            onView={(h) => viewDialog.open(h.id)}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onAddNote={handleAddNote}
            onViewNote={handleViewNote}
          />

          {/* Empty State */}
          {allHistories.length === 0 && (
            <div
              className="text-center py-8 border rounded-md"
              style={{ borderColor: "var(--border-color)" }}
            >
              <History className="icon-xl mx-auto mb-2" style={{ color: "var(--text-secondary)" }} />
              <p className="text-base" style={{ color: "var(--sidebar-text)" }}>
                No debt history found.
              </p>
              <p className="mt-xs text-sm" style={{ color: "var(--text-tertiary)" }}>
                {filters.search || filters.transactionType !== "all" || filters.debtId !== "all"
                  ? "Try adjusting your search or filters"
                  : "History will appear as debt payments are recorded"}
              </p>
              <div className="mt-2 gap-xs flex justify-center">
                {(filters.search || filters.transactionType !== "all" || filters.debtId !== "all") && (
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
      <DebtHistoryViewDialog hook={viewDialog} />
      <DebtHistoryNoteDialog
        isOpen={noteDialog.isOpen}
        history={noteDialog.history}
        onClose={() => setNoteDialog({ isOpen: false, history: null })}
        onSuccess={reload}
      />
      <DebtHistoryViewNoteDialog
        isOpen={viewNoteDialog.isOpen}
        history={viewNoteDialog.history}
        onClose={() => setViewNoteDialog({ isOpen: false, history: null })}
      />
    </div>
  );
};

export default DebtHistoryPage;