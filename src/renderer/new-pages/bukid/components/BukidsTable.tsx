// src/renderer/pages/bukid/components/BukidsTable.tsx
import React from "react";
import { ChevronUp, ChevronDown, Bell } from "lucide-react";
import BukidActionsDropdown from "./BukidActionsDropdown";
import type { Bukid } from "../../../api/core/bukid";
import { formatDate } from "../../../utils/formatters";

interface BukidsTableProps {
  bukids: Bukid[];
  selectedBukids: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  onView: (bukid: Bukid) => void;
  onEdit: (bukid: Bukid) => void;
  onDelete: (bukid: Bukid) => void;
  onAddPlot?: (bukid: Bukid) => void;
  onAddNote?: (bukid: Bukid) => void;
  onViewNote?: (bukid: Bukid) => void;
  onMarkComplete?: (bukid: Bukid) => void;
  onMarkCancelled?: (bukid: Bukid) => void;
}

const BukidsTable: React.FC<BukidsTableProps> = ({
  bukids,
  selectedBukids,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  sortConfig,
  onView,
  onEdit,
  onDelete,
  onAddPlot,
  onAddNote,
  onViewNote,
  onMarkComplete,
  onMarkCancelled,
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
      inactive: { bg: "bg-gray-100", text: "text-gray-700" },
      complete: { bg: "bg-purple-100", text: "text-purple-700" },
      initiated: { bg: "bg-blue-100", text: "text-blue-700" },
    };
    const config = statusMap[status] || {
      bg: "bg-gray-100",
      text: "text-gray-700",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div
      className="overflow-x-auto rounded-md border compact-table"
      style={{ borderColor: "var(--border-color)" }}
    >
      <table
        className="min-w-full"
        style={{ borderColor: "var(--border-color)" }}
      >
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
                checked={
                  bukids.length > 0 && selectedBukids.length === bukids.length
                }
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
              onClick={() => onSort("location")}
            >
              <div className="flex items-center gap-xs">
                <span>Location</span>
                {getSortIcon("location")}
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
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              Session
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("createdAt")}
            >
              <div className="flex items-center gap-xs">
                <span>Created</span>
                {getSortIcon("createdAt")}
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
          {bukids.map((bukid) => (
            <tr
              key={bukid.id}
              onClick={(e) => {
                e.stopPropagation();
                onView(bukid);
              }}
              className={`hover:bg-[var(--card-secondary-bg)] transition-colors ${
                selectedBukids.includes(bukid.id)
                  ? "bg-[var(--accent-blue-dark)]"
                  : ""
              }`}
              style={{ borderBottom: "1px solid var(--border-color)" }}
            >
              <td className="px-2 py-2 whitespace-nowrap">
                <input
                  type="checkbox"
                  onClick={(e) => e.stopPropagation()}
                  checked={selectedBukids.includes(bukid.id)}
                  onChange={() => onToggleSelect(bukid.id)}
                  className="h-3 w-3 rounded border-gray-300"
                  style={{ color: "var(--accent-blue)" }}
                />
              </td>
              <td
                className="px-4 py-2 whitespace-nowrap text-sm font-medium"
                style={{ color: "var(--sidebar-text)" }}
              >
                <div className="flex items-center gap-2">
                  <span>{bukid.name}</span>
                  {bukid.notes && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewNote?.(bukid);
                      }}
                      className="focus:outline-none hover:scale-110 transition-transform"
                      title="View note"
                    >
                      <Bell className="w-4 h-4 text-yellow-500 animate-pulse hover:text-yellow-600" />
                    </button>
                  )}
                </div>
              </td>
              <td
                className="px-4 py-2 whitespace-nowrap text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {bukid.location || "-"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {getStatusBadge(bukid.status)}
              </td>
              <td
                className="px-4 py-2 whitespace-nowrap text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {bukid.session?.name || "-"}
              </td>
              <td
                className="px-4 py-2 whitespace-nowrap text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {formatDate(bukid.createdAt, "MMM dd, yyyy")}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                <BukidActionsDropdown
                  bukid={bukid}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAddPlot={onAddPlot}
                  onAddNote={onAddNote}
                  onViewNote={onViewNote}
                  onMarkComplete={onMarkComplete}
                  onMarkCancelled={onMarkCancelled}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BukidsTable;