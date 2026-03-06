// src/renderer/pages/worker-payments/index.tsx
import React, { useState } from "react";
import { Download, RefreshCw, Users } from "lucide-react"; // removed Filter icon
import { useWorkerPayments } from "./hooks/useWorkerPayments";
import WorkerPaymentsTable from "./components/WorkerPaymentsTable";
import Pagination from "../../components/Shared/Pagination";
import Button from "../../components/UI/Button";
import { dialogs } from "../../utils/dialogs";
import { showSuccess, showError } from "../../utils/notification";
import PayAllModal from "./components/PayAllModal";
import PayDebtModal from "./components/PayDebtModal";

const WorkerPaymentsPage: React.FC = () => {
  const {
    workers,
    allWorkers,
    loading,
    error,
    pagination,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload,
    selectedWorkerId,
    setSelectedWorkerId,
    payAllModal,
    payDebtModal,
  } = useWorkerPayments();

  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "excel" | "pdf">("csv");

  const handleExport = async () => {
    if (allWorkers.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Export Data",
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

  const totalPending = allWorkers.reduce((sum, w) => sum + w.pendingAmount, 0);
  const totalDebt = allWorkers.reduce((sum, w) => sum + w.totalDebt, 0);

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
            Worker Payments
          </h2>
          <p
            className="mt-xs text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Manage worker payments and debts
          </p>
        </div>
        <div className="flex flex-wrap gap-xs w-full sm:w-auto">
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
              disabled={exportLoading || allWorkers.length === 0}
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
              <span className="font-medium">Total Pending:</span>
              <span className="text-blue-600">₱{totalPending.toLocaleString()}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="font-medium">Total Debt:</span>
              <span className="text-orange-600">₱{totalDebt.toLocaleString()}</span>
            </span>
          </div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Total Workers: {pagination.total}
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
          <WorkerPaymentsTable
            workers={workers}
            onPayAll={(worker) => {
              setSelectedWorkerId(worker.id);
              payAllModal.open(worker);
            }}
            onPayDebt={(worker) => {
              setSelectedWorkerId(worker.id);
              payDebtModal.open(worker);
            }}
          />

          {/* Empty State */}
          {allWorkers.length === 0 && (
            <div
              className="text-center py-8 border rounded-md"
              style={{ borderColor: "var(--border-color)" }}
            >
              <Users
                className="icon-xl mx-auto mb-2"
                style={{ color: "var(--text-secondary)" }}
              />
              <p className="text-base" style={{ color: "var(--sidebar-text)" }}>
                No workers found.
              </p>
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

      {/* Modals */}
      <PayAllModal
        isOpen={payAllModal.isOpen}
        worker={payAllModal.worker}
        onClose={payAllModal.close}
        onSuccess={() => {
          reload();
          payAllModal.close();
        }}
      />
      <PayDebtModal
        isOpen={payDebtModal.isOpen}
        worker={payDebtModal.worker}
        onClose={payDebtModal.close}
        onSuccess={() => {
          reload();
          payDebtModal.close();
        }}
      />
    </div>
  );
};

export default WorkerPaymentsPage;