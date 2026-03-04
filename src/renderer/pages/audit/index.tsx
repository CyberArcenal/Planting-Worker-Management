// src/renderer/pages/audit/index.tsx
import React, { useState } from 'react';
import { Download, Filter, RefreshCw, History } from 'lucide-react';
import Button from '../../components/UI/Button';
import Pagination from '../../components/Shared/Pagination1';
import { dialogs } from '../../utils/dialogs';
import { showSuccess, showError } from '../../utils/notification';
import { useAuditLogs } from './hooks/useAuditLogs';
import { useAuditView } from './hooks/useAuditView';
import FilterBar from './components/FilterBar';
import AuditTable from './components/AuditTable';
import AuditViewDialog from './components/AuditViewDialog';
import { auditLogExportAPI, type AuditLogExportParams } from '../../api/exports/audit';
import { formatDate } from '../../utils/formatters';

const AuditPage: React.FC = () => {
  const {
    logs,
    allLogs,
    filters,
    loading,
    error,
    pagination,
    selectedLogs,
    setSelectedLogs,
    sortConfig,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload,
    handleFilterChange,
    resetFilters,
    toggleLogSelection,
    toggleSelectAll,
    handleSort,
  } = useAuditLogs();

  const viewDialog = useAuditView();

  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');

  const handleExport = async () => {
    if (allLogs.length === 0) return;
    
    const confirmed = await dialogs.confirm({
      title: 'Export Audit Logs',
      message: `Export ${pagination.total} logs as ${exportFormat.toUpperCase()}?`,
    });
    if (!confirmed) return;
    
    setExportLoading(true);
    try {
      // Map filters to AuditLogExportParams format
      const exportParams: AuditLogExportParams = {
        format: exportFormat,
        action_type: filters.action || undefined,
        model_name: filters.entity || undefined,
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
        search: filters.search || undefined,
        // user filter is included in search
        // risk_level not available in current filters
      };
      
      await auditLogExportAPI.exportAuditLogs(exportParams);
      // No need for extra success message because exportAPI already shows dialogs
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
  const uniqueActions = new Set(allLogs.map(l => l.action)).size;
  const uniqueUsers = new Set(allLogs.map(l => l.user).filter(Boolean)).size;

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
            Audit Trail
          </h2>
          <p className="mt-xs text-sm" style={{ color: "var(--text-secondary)" }}>
            Track all system activities and changes
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
            Filters {showFilters ? '↑' : '↓'}
          </button>
          <button
            onClick={reload}
            disabled={loading}
            className="btn btn-secondary btn-sm rounded-md flex items-center transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`icon-sm mr-1 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
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
              disabled={exportLoading || allLogs.length === 0}
              className="compact-button rounded-md flex items-center gap-1 px-2 py-1 text-xs"
            >
              <Download className="icon-xs" />
              {exportLoading ? '...' : 'Export'}
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
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Total Logs: {pagination.total}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Unique Actions: {uniqueActions}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Active Users: {uniqueUsers}
            </span>
          </div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Latest: {logs.length > 0 ? formatDate(logs[0]?.timestamp, 'MMM dd, yyyy HH:mm') : '-'}
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

      {/* Bulk Selection (optional) */}
      {selectedLogs.length > 0 && (
        <div
          className="mb-2 compact-card rounded-md border flex items-center justify-between p-2"
          style={{
            backgroundColor: "var(--accent-blue-dark)",
            borderColor: "var(--accent-blue)",
          }}
        >
          <span className="font-medium text-sm" style={{ color: "var(--accent-green)" }}>
            {selectedLogs.length} log(s) selected
          </span>
          <div className="flex gap-xs">
            {/* No bulk actions for now */}
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
            'No entries found'
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
      {error && <div className="text-center py-4 text-red-500">Error: {error}</div>}

      {/* Table */}
      {!loading && !error && (
        <>
          <AuditTable
            logs={logs}
            selectedLogs={selectedLogs}
            onToggleSelect={toggleLogSelection}
            onToggleSelectAll={toggleSelectAll}
            onSort={handleSort}
            sortConfig={sortConfig}
            onView={(log) => viewDialog.open(log.id)}
          />

          {/* Empty State */}
          {allLogs.length === 0 && (
            <div
              className="text-center py-8 border rounded-md"
              style={{ borderColor: "var(--border-color)" }}
            >
              <History className="icon-xl mx-auto mb-2" style={{ color: "var(--text-secondary)" }} />
              <p className="text-base" style={{ color: "var(--sidebar-text)" }}>
                No audit logs found.
              </p>
              <p className="mt-xs text-sm" style={{ color: "var(--text-tertiary)" }}>
                {Object.values(filters).some((v) => v)
                  ? 'Try adjusting your search or filters'
                  : 'Logs will appear when system activities occur'}
              </p>
              <div className="mt-2 gap-xs flex justify-center">
                {Object.values(filters).some((v) => v) && (
                  <button
                    className="compact-button rounded-md"
                    style={{ backgroundColor: "var(--accent-blue)", color: "white" }}
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
      <AuditViewDialog
        log={viewDialog.log}
        loading={viewDialog.loading}
        isOpen={viewDialog.isOpen}
        onClose={viewDialog.close}
      />
    </div>
  );
};

export default AuditPage;