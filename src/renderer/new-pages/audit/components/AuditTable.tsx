// src/renderer/pages/audit/components/AuditTable.tsx
import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { AuditLogEntry } from '../../../api/core/audit';
import { formatDate } from '../../../utils/formatters';
import AuditActionsDropdown from './AuditActionsDropdown';

interface AuditTableProps {
  logs: AuditLogEntry[];
  selectedLogs: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  onView: (log: AuditLogEntry) => void;
}

const AuditTable: React.FC<AuditTableProps> = ({
  logs,
  selectedLogs,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  sortConfig,
  onView,
}) => {
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="icon-sm" />
    ) : (
      <ChevronDown className="icon-sm" />
    );
  };

  return (
    <div
      className="overflow-x-auto rounded-md border compact-table"
      style={{ borderColor: "var(--border-color)" }}
    >
      <table className="min-w-full" style={{ borderColor: "var(--border-color)" }}>
        <thead style={{ backgroundColor: "var(--card-secondary-bg)" }}>
          <tr>
            <th
              scope="col"
              className="w-10 px-2 py-2 text-left text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              <input
                type="checkbox"
                checked={logs.length > 0 && selectedLogs.length === logs.length}
                onChange={onToggleSelectAll}
                className="h-3 w-3 rounded border-gray-300"
                style={{ color: "var(--accent-blue)" }}
              />
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("id")}
            >
              <div className="flex items-center gap-xs">
                <span>ID</span>
                {getSortIcon("id")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("action")}
            >
              <div className="flex items-center gap-xs">
                <span>Action</span>
                {getSortIcon("action")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("entity")}
            >
              <div className="flex items-center gap-xs">
                <span>Entity</span>
                {getSortIcon("entity")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("entityId")}
            >
              <div className="flex items-center gap-xs">
                <span>Entity ID</span>
                {getSortIcon("entityId")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("user")}
            >
              <div className="flex items-center gap-xs">
                <span>User</span>
                {getSortIcon("user")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("timestamp")}
            >
              <div className="flex items-center gap-xs">
                <span>Timestamp</span>
                {getSortIcon("timestamp")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              Description
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody style={{ backgroundColor: "var(--card-bg)" }}>
          {logs.map((log) => (
            <tr
              key={log.id}
              onClick={(e)=> {e.stopPropagation(); onView(log)}}
              className={`hover:bg-[var(--card-secondary-bg)] transition-colors ${
                selectedLogs.includes(log.id) ? "bg-[var(--accent-blue-dark)]" : ""
              }`}
              style={{ borderBottom: "1px solid var(--border-color)" }}
            >
              <td className="px-2 py-2 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedLogs.includes(log.id)}
                  onChange={() => onToggleSelect(log.id)}
                  className="h-3 w-3 rounded border-gray-300"
                  style={{ color: "var(--accent-blue)" }}
                />
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {log.id}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium" style={{ color: "var(--sidebar-text)" }}>
                {log.action}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {log.entity}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {log.entityId || '-'}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {log.user || 'System'}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {formatDate(log.timestamp, 'MMM dd, yyyy HH:mm:ss')}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm max-w-[200px] truncate" style={{ color: "var(--text-secondary)" }}>
                {log.description || '-'}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                <AuditActionsDropdown
                  log={log}
                  onView={onView}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AuditTable;