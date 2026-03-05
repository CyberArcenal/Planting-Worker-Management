// src/renderer/pages/sessions/components/SessionsTable.tsx
import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { Session } from "../../../api/core/session";
import { formatDate } from "../../../utils/formatters";
import SessionActionsDropdown from "./SessionActionsDropdown";

interface SessionsTableProps {
  sessions: Session[];
  selectedSessions: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  onView: (session: Session) => void;
  onEdit: (session: Session) => void;
  onDelete: (session: Session) => void;
}

const SessionsTable: React.FC<SessionsTableProps> = ({
  sessions,
  selectedSessions,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  sortConfig,
  onView,
  onEdit,
  onDelete,
}) => {
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="icon-sm" />
    ) : (
      <ChevronDown className="icon-sm" />
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      active: { bg: "bg-green-100", text: "text-green-700" },
      closed: { bg: "bg-gray-100", text: "text-gray-700" },
      archived: { bg: "bg-purple-100", text: "text-purple-700" },
    };
    const config = statusMap[status] || { bg: "bg-gray-100", text: "text-gray-700" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getSeasonTypeDisplay = (type?: string | null) => {
    if (!type) return "-";
    const map: Record<string, string> = {
      "tag-ulan": "Tag-ulan",
      "tag-araw": "Tag-araw",
      custom: "Custom",
    };
    return map[type] || type;
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
                onClick={(e) => e.stopPropagation()}
                checked={sessions.length > 0 && selectedSessions.length === sessions.length}
                onChange={onToggleSelectAll}
                className="h-3 w-3 rounded border-gray-300"
                style={{ color: "var(--accent-blue)" }}
              />
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("name")}
            >
              <div className="flex items-center gap-xs">
                <span>Name</span>
                {getSortIcon("name")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("seasonType")}
            >
              <div className="flex items-center gap-xs">
                <span>Season</span>
                {getSortIcon("seasonType")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("year")}
            >
              <div className="flex items-center gap-xs">
                <span>Year</span>
                {getSortIcon("year")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("startDate")}
            >
              <div className="flex items-center gap-xs">
                <span>Start Date</span>
                {getSortIcon("startDate")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("endDate")}
            >
              <div className="flex items-center gap-xs">
                <span>End Date</span>
                {getSortIcon("endDate")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("status")}
            >
              <div className="flex items-center gap-xs">
                <span>Status</span>
                {getSortIcon("status")}
              </div>
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
          {sessions.map((session) => (
            <tr
              key={session.id}
              onClick={(e) => { e.stopPropagation(); onView(session); }}
              className={`hover:bg-[var(--card-secondary-bg)] transition-colors ${
                selectedSessions.includes(session.id) ? "bg-[var(--accent-blue-dark)]" : ""
              }`}
              style={{ borderBottom: "1px solid var(--border-color)" }}
            >
              <td className="px-2 py-2 whitespace-nowrap">
                <input
                  type="checkbox"
                  onClick={(e) => e.stopPropagation()}
                  checked={selectedSessions.includes(session.id)}
                  onChange={() => onToggleSelect(session.id)}
                  className="h-3 w-3 rounded border-gray-300"
                  style={{ color: "var(--accent-blue)" }}
                />
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium" style={{ color: "var(--sidebar-text)" }}>
                {session.name}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {getSeasonTypeDisplay(session.seasonType)}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {session.year}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {session.startDate ? formatDate(session.startDate, "MMM dd, yyyy") : "-"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {session.endDate ? formatDate(session.endDate, "MMM dd, yyyy") : "-"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {getStatusBadge(session.status)}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                <SessionActionsDropdown
                  session={session}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SessionsTable;