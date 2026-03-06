// src/renderer/pages/payments/index.tsx
import React, { useState } from "react";
import { Plus, Download, Filter, RefreshCw, DollarSign } from "lucide-react";
import { usePayments } from "./hooks/usePayments";
import paymentAPI from "../../api/core/payment";
import Pagination from "../../components/Shared/Pagination";
import Button from "../../components/UI/Button";
import { dialogs } from "../../utils/dialogs";
import { showError, showSuccess } from "../../utils/notification";
import FilterBar from "./components/FilterBar";
import PaymentsTable from "./components/PaymentsTable";
import PaymentViewDialog from "./components/PaymentViewDialog";
import { usePaymentView } from "./hooks/usePaymentView";
import PaymentNoteDialog from "./components/PaymentNoteDialog";
import PaymentViewNoteDialog from "./components/PaymentViewNoteDialog";

const PaymentsPage: React.FC = () => {
  const {
    payments,
    allPayments,
    filters,
    loading,
    error,
    pagination,
    selectedPayments,
    setSelectedPayments,
    sortConfig,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload,
    handleFilterChange,
    resetFilters,
    togglePaymentSelection,
    toggleSelectAll,
    handleSort,
  } = usePayments();

  const viewDialog = usePaymentView();

  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "excel" | "pdf">(
    "csv",
  );

  // Note dialogs
  const [noteDialog, setNoteDialog] = useState<{
    isOpen: boolean;
    payment: any | null;
  }>({ isOpen: false, payment: null });

  const [viewNoteDialog, setViewNoteDialog] = useState<{
    isOpen: boolean;
    payment: any | null;
  }>({ isOpen: false, payment: null });

  // Handlers for dropdown actions
  const handleEdit = (payment: any) => {
    // For now, open the note dialog (since editing might just be notes)
    setNoteDialog({ isOpen: true, payment });
  };

  const handleMarkComplete = async (payment: any) => {
    const confirmed = await dialogs.confirm({
      title: "Mark as Complete",
      message: `Mark payment for "${payment.worker?.name}" as complete?`,
    });
    if (!confirmed) return;
    try {
      await paymentAPI.updateStatus(payment.id, "completed");
      showSuccess("Payment marked as complete.");
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleMarkCancelled = async (payment: any) => {
    const confirmed = await dialogs.confirm({
      title: "Mark as Cancelled",
      message: `Cancel payment for "${payment.worker?.name}"?`,
    });
    if (!confirmed) return;
    try {
      await paymentAPI.updateStatus(payment.id, "cancel");
      showSuccess("Payment cancelled.");
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleAddNote = (payment: any) => {
    setNoteDialog({ isOpen: true, payment });
  };

  const handleViewNote = (payment: any) => {
    setViewNoteDialog({ isOpen: true, payment });
  };

  const handleSendReceipt = async (payment: any) => {
    // Placeholder – in real app, you'd call an API to send receipt
    const confirmed = await dialogs.confirm({
      title: "Send Receipt",
      message: `Send receipt for payment #${payment.id}?`,
    });
    if (!confirmed) return;
    try {
      // await notificationAPI.sendReceipt(payment.id);
      showSuccess("Receipt sent (placeholder).");
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleDelete = async (payment: any) => {
    const confirmed = await dialogs.confirm({
      title: "Delete Payment",
      message: `Are you sure you want to delete payment for worker "${payment.worker?.name}"?`,
    });
    if (!confirmed) return;
    try {
      await paymentAPI.delete(payment.id);
      showSuccess("Payment deleted successfully.");
      reload();
    } catch (err: any) {
      dialogs.alert({ title: "Error", message: err.message });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPayments.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Bulk Delete",
      message: `Delete ${selectedPayments.length} payments?`,
    });
    if (!confirmed) return;
    try {
      await Promise.all(selectedPayments.map((id) => paymentAPI.delete(id)));
      showSuccess(`${selectedPayments.length} payments deleted.`);
      setSelectedPayments([]);
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleExport = async () => {
    if (allPayments.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Export Payments",
      message: `Export ${pagination.total} payments as ${exportFormat.toUpperCase()}?`,
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

  const totalGross = allPayments.reduce((sum, p) => sum + p.grossPay, 0);
  const totalNet = allPayments.reduce((sum, p) => sum + p.netPay, 0);
  const totalDeductions = allPayments.reduce(
    (sum, p) => sum + (p.grossPay - p.netPay),
    0,
  );

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
            Payments
          </h2>
          <p
            className="mt-xs text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Manage worker payments and deductions
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
              disabled={exportLoading || allPayments.length === 0}
              className="compact-button rounded-md flex items-center gap-1 px-2 py-1 text-xs"
            >
              <Download className="icon-xs" />
              {exportLoading ? "..." : "Export"}
            </Button>
          </div>
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
              <span className="font-medium">Total Gross:</span>
              <span className="text-green-600">
                ₱{totalGross.toLocaleString()}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <span className="font-medium">Total Net:</span>
              <span className="text-blue-600">
                ₱{totalNet.toLocaleString()}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <span className="font-medium">Total Deductions:</span>
              <span className="text-red-600">
                ₱{totalDeductions.toLocaleString()}
              </span>
            </span>
          </div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Total Payments: {pagination.total}
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
      {selectedPayments.length > 0 && (
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
            {selectedPayments.length} payment(s) selected
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
          <PaymentsTable
            payments={payments}
            selectedPayments={selectedPayments}
            onToggleSelect={togglePaymentSelection}
            onToggleSelectAll={toggleSelectAll}
            onSort={handleSort}
            sortConfig={sortConfig}
            onView={(p) => viewDialog.open(p.id)}
            onDelete={handleDelete}
            // New actions
            onEdit={handleEdit}
            onMarkComplete={handleMarkComplete}
            onMarkCancelled={handleMarkCancelled}
            onAddNote={handleAddNote}
            onViewNote={handleViewNote}
            onSendReceipt={handleSendReceipt}
          />

          {/* Empty State */}
          {allPayments.length === 0 && (
            <div
              className="text-center py-8 border rounded-md"
              style={{ borderColor: "var(--border-color)" }}
            >
              <DollarSign
                className="icon-xl mx-auto mb-2"
                style={{ color: "var(--text-secondary)" }}
              />
              <p className="text-base" style={{ color: "var(--sidebar-text)" }}>
                No payments found.
              </p>
              <p
                className="mt-xs text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                {filters.search ||
                filters.status !== "all" ||
                filters.workerId !== "all" ||
                filters.pitakId !== "all" ||
                filters.sessionId !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start by adding your first payment"}
              </p>
              <div className="mt-2 gap-xs flex justify-center">
                {(filters.search ||
                  filters.status !== "all" ||
                  filters.workerId !== "all" ||
                  filters.pitakId !== "all" ||
                  filters.sessionId !== "all") && (
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
      <PaymentViewDialog hook={viewDialog} />
      <PaymentNoteDialog
        isOpen={noteDialog.isOpen}
        payment={noteDialog.payment}
        onClose={() => setNoteDialog({ isOpen: false, payment: null })}
        onSuccess={reload}
      />
      <PaymentViewNoteDialog
        isOpen={viewNoteDialog.isOpen}
        payment={viewNoteDialog.payment}
        onClose={() => setViewNoteDialog({ isOpen: false, payment: null })}
      />
    </div>
  );
};

export default PaymentsPage;
