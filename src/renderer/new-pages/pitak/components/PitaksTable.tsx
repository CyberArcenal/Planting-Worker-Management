// src/renderer/pages/pitak/components/PitaksTable.tsx
import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { Pitak } from "../../../api/core/pitak";
import { formatDate } from "../../../utils/formatters";
import PitakActionsDropdown from "./PitakActionsDropdown";

interface PitaksTableProps {
  pitaks: Pitak[];
  selectedPitaks: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  onView: (pitak: Pitak) => void;
  onEdit: (pitak: Pitak) => void;
  onDelete: (pitak: Pitak) => void;
  // Optional additional actions
  onAssignWorkers: (pitak: Pitak) => void;
  onMarkCancelled?: (pitak: Pitak) => void;
  onMarkComplete?: (pitak: Pitak) => void;
  onAddNote?: (pitak: Pitak) => void;
  onViewNote?: (pitak: Pitak) => void;
}
const PitaksTable: React.FC<PitaksTableProps> = ({
  pitaks,
  selectedPitaks,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  sortConfig,
  onView,
  onEdit,
  onDelete,
  onAssignWorkers,
  onMarkCancelled,
  onMarkComplete,
  onAddNote,
  onViewNote,
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
      archived: { bg: "bg-purple-100", text: "text-purple-700" },
    };
    const config = statusMap[status] || { bg: "bg-gray-100", text: "text-gray-700" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
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
                onClick={(e) => e.stopPropagation()}
                checked={pitaks.length > 0 && selectedPitaks.length === pitaks.length}
                onChange={onToggleSelectAll}
                className="h-3 w-3 rounded border-gray-300"
                style={{ color: "var(--accent-blue)" }}
              />
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
              onClick={() => onSort("totalLuwang")}
            >
              <div className="flex items-center gap-xs">
                <span>Total Luwang</span>
                {getSortIcon("totalLuwang")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("areaSqm")}
            >
              <div className="flex items-center gap-xs">
                <span>Area (sqm)</span>
                {getSortIcon("areaSqm")}
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
              Bukid
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
          {pitaks.map((pitak) => (
            <tr
              key={pitak.id}
              onClick={(e) => { e.stopPropagation(); onView(pitak); }}
              className={`hover:bg-[var(--card-secondary-bg)] transition-colors ${
                selectedPitaks.includes(pitak.id) ? "bg-[var(--accent-blue-dark)]" : ""
              }`}
              style={{ borderBottom: "1px solid var(--border-color)" }}
            >
              <td className="px-2 py-2 whitespace-nowrap">
                <input
                  type="checkbox"
                  onClick={(e) => e.stopPropagation()}
                  checked={selectedPitaks.includes(pitak.id)}
                  onChange={() => onToggleSelect(pitak.id)}
                  className="h-3 w-3 rounded border-gray-300"
                  style={{ color: "var(--accent-blue)" }}
                />
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium" style={{ color: "var(--sidebar-text)" }}>
                {pitak.location}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {pitak.totalLuwang}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {pitak.areaSqm}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {getStatusBadge(pitak.status)}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {pitak.bukid?.name || "-"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {formatDate(pitak.createdAt, "MMM dd, yyyy")}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                <PitakActionsDropdown
                 pitak={pitak}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  // Pass new actions
                  onAssignWorker={onAssignWorkers}
                  onMarkCancelled={onMarkCancelled}
                  onMarkComplete={onMarkComplete}
                  onAddNote={onAddNote}
                  onViewNote={onViewNote}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PitaksTable;