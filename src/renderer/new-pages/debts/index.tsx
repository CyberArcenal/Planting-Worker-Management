// src/renderer/pages/debts/index.tsx
import React, { useState } from "react";
import { Plus, Download, Filter, RefreshCw, Receipt } from "lucide-react";
import { useDebts } from "./hooks/useDebts";
import debtAPI from "../../api/core/debt";
import Pagination from "../../components/Shared/Pagination";
import Button from "../../components/UI/Button";
import { dialogs } from "../../utils/dialogs";
import { showError, showSuccess } from "../../utils/notification";
import DebtFormDialog from "./components/DebtFormDialog";
import DebtsTable from "./components/DebtsTable";
import DebtViewDialog from "./components/DebtViewDialog";
import FilterBar from "./components/FilterBar";
import { useDebtForm } from "./hooks/useDebtForm";
import { useDebtView } from "./hooks/useDebtView";
import DebtReasonDialog from "./components/DebtReasonDialog";
import DebtViewReasonDialog from "./components/DebtViewReasonDialog";

const DebtsPage: React.FC = () => {
  const {
    debts,
    allDebts,
    filters,
    loading,
    error,
    pagination,
    selectedDebts,
    setSelectedDebts,
    sortConfig,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload,
    handleFilterChange,
    resetFilters,
    toggleDebtSelection,
    toggleSelectAll,
    handleSort,
  } = useDebts();

  const formDialog = useDebtForm();
  const viewDialog = useDebtView();

  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "excel" | "pdf">("csv");

  // Reason dialogs
  const [reasonDialog, setReasonDialog] = useState<{
    isOpen: boolean;
    debt: any | null;
  }>({ isOpen: false, debt: null });

  const [viewReasonDialog, setViewReasonDialog] = useState<{
    isOpen: boolean;
    debt: any | null;
  }>({ isOpen: false, debt: null });

  // Status change handlers
  const handleMarkPaid = async (debt: any) => {
    const confirmed = await dialogs.confirm({
      title: "Mark as Paid",
      message: `Mark debt for "${debt.worker?.name}" as paid?`,
    });
    if (!confirmed) return;
    try {
      await debtAPI.updateStatus(debt.id, "paid");
      showSuccess("Debt marked as paid.");
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleMarkCancelled = async (debt: any) => {
    const confirmed = await dialogs.confirm({
      title: "Mark as Cancelled",
      message: `Cancel debt for "${debt.worker?.name}"?`,
    });
    if (!confirmed) return;
    try {
      await debtAPI.updateStatus(debt.id, "cancelled");
      showSuccess("Debt cancelled.");
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleAddReason = (debt: any) => {
    setReasonDialog({ isOpen: true, debt });
  };

  const handleViewReason = (debt: any) => {
    setViewReasonDialog({ isOpen: true, debt });
  };

  const handleDelete = async (debt: any) => {
    const confirmed = await dialogs.confirm({
      title: "Delete Debt",
      message: `Are you sure you want to delete debt for worker "${debt.worker?.name}"?`,
    });
    if (!confirmed) return;
    try {
      await debtAPI.delete(debt.id);
      showSuccess("Debt deleted successfully.");
      reload();
    } catch (err: any) {
      dialogs.alert({ title: "Error", message: err.message });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDebts.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Bulk Delete",
      message: `Delete ${selectedDebts.length} debts?`,
    });
    if (!confirmed) return;
    try {
      await Promise.all(selectedDebts.map((id) => debtAPI.delete(id)));
      showSuccess(`${selectedDebts.length} debts deleted.`);
      setSelectedDebts([]);
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleExport = async () => {
    if (allDebts.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Export Debts",
      message: `Export ${pagination.total} debts as ${exportFormat.toUpperCase()}?`,
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

  const totalAmount = allDebts.reduce((sum, d) => sum + d.amount, 0);
  const totalBalance = allDebts.reduce((sum, d) => sum + d.balance, 0);
  const totalPaid = allDebts.reduce((sum, d) => sum + d.totalPaid, 0);

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
            Debt Management
          </h2>
          <p
            className="mt-xs text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Manage worker debts and payments
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
              disabled={exportLoading || allDebts.length === 0}
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
            Add Debt
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
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="font-medium">Total Amount:</span>
              <span className="text-blue-600">₱{totalAmount.toLocaleString()}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="font-medium">Total Balance:</span>
              <span className="text-orange-600">₱{totalBalance.toLocaleString()}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="font-medium">Total Paid:</span>
              <span className="text-green-600">₱{totalPaid.toLocaleString()}</span>
            </span>
          </div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Total Debts: {pagination.total}
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
      {selectedDebts.length > 0 && (
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
            {selectedDebts.length} debt(s) selected
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
          <DebtsTable
            debts={debts}
            selectedDebts={selectedDebts}
            onToggleSelect={toggleDebtSelection}
            onToggleSelectAll={toggleSelectAll}
            onSort={handleSort}
            sortConfig={sortConfig}
            onView={(d) => viewDialog.open(d.id)}
            onEdit={(d)=> {formDialog.openEdit(d.id)}}
            onDelete={handleDelete}
            // New actions
            onMarkPaid={handleMarkPaid}
            onMarkCancelled={handleMarkCancelled}
            onAddReason={handleAddReason}
            onViewReason={handleViewReason}
          />

          {/* Empty State */}
          {allDebts.length === 0 && (
            <div
              className="text-center py-8 border rounded-md"
              style={{ borderColor: "var(--border-color)" }}
            >
              <Receipt
                className="icon-xl mx-auto mb-2"
                style={{ color: "var(--text-secondary)" }}
              />
              <p className="text-base" style={{ color: "var(--sidebar-text)" }}>
                No debts found.
              </p>
              <p
                className="mt-xs text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                {filters.search || filters.status !== "all" || filters.workerId !== "all" || filters.sessionId !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start by adding your first debt"}
              </p>
              <div className="mt-2 gap-xs flex justify-center">
                {(filters.search || filters.status !== "all" || filters.workerId !== "all" || filters.sessionId !== "all") && (
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
                  Add First Debt
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
      <DebtFormDialog
        isOpen={formDialog.isOpen}
        mode={formDialog.mode}
        debtId={formDialog.debtId}
        onClose={formDialog.close}
        onSuccess={reload}
      />

      <DebtViewDialog hook={viewDialog} />

      <DebtReasonDialog
        isOpen={reasonDialog.isOpen}
        debt={reasonDialog.debt}
        onClose={() => setReasonDialog({ isOpen: false, debt: null })}
        onSuccess={reload}
      />

      <DebtViewReasonDialog
        isOpen={viewReasonDialog.isOpen}
        debt={viewReasonDialog.debt}
        onClose={() => setViewReasonDialog({ isOpen: false, debt: null })}
      />
    </div>
  );
};

export default DebtsPage;