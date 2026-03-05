// src/renderer/pages/assignments/components/AssignmentsTable.tsx
import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { Assignment } from "../../../api/core/assignment";
import { formatDate } from "../../../utils/formatters";
import AssignmentActionsDropdown from "./AssignmentActionsDropdown";

interface AssignmentsTableProps {
  assignments: Assignment[];
  selectedAssignments: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  onView: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
}

const AssignmentsTable: React.FC<AssignmentsTableProps> = ({
  assignments,
  selectedAssignments,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  sortConfig,
  onView,
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
      completed: { bg: "bg-blue-100", text: "text-blue-700" },
      cancelled: { bg: "bg-red-100", text: "text-red-700" },
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
                checked={assignments.length > 0 && selectedAssignments.length === assignments.length}
                onChange={onToggleSelectAll}
                className="h-3 w-3 rounded border-gray-300"
                style={{ color: "var(--accent-blue)" }}
              />
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("worker")}
            >
              <div className="flex items-center gap-xs">
                <span>Worker</span>
                {getSortIcon("worker")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("pitak")}
            >
              <div className="flex items-center gap-xs">
                <span>Pitak</span>
                {getSortIcon("pitak")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("luwangCount")}
            >
              <div className="flex items-center gap-xs">
                <span>Luwang</span>
                {getSortIcon("luwangCount")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("assignmentDate")}
            >
              <div className="flex items-center gap-xs">
                <span>Date</span>
                {getSortIcon("assignmentDate")}
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
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("session")}
            >
              <div className="flex items-center gap-xs">
                <span>Session</span>
                {getSortIcon("session")}
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
          {assignments.map((assignment) => (
            <tr
              key={assignment.id}
              onClick={(e) => { e.stopPropagation(); onView(assignment); }}
              className={`hover:bg-[var(--card-secondary-bg)] transition-colors ${
                selectedAssignments.includes(assignment.id) ? "bg-[var(--accent-blue-dark)]" : ""
              }`}
              style={{ borderBottom: "1px solid var(--border-color)" }}
            >
              <td className="px-2 py-2 whitespace-nowrap">
                <input
                  type="checkbox"
                  onClick={(e) => e.stopPropagation()}
                  checked={selectedAssignments.includes(assignment.id)}
                  onChange={() => onToggleSelect(assignment.id)}
                  className="h-3 w-3 rounded border-gray-300"
                  style={{ color: "var(--accent-blue)" }}
                />
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium" style={{ color: "var(--sidebar-text)" }}>
                {assignment.worker?.name || "-"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {assignment.pitak?.location || "-"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {assignment.luwangCount}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {formatDate(assignment.assignmentDate, "MMM dd, yyyy")}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {getStatusBadge(assignment.status)}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {assignment.session?.name || "-"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                <AssignmentActionsDropdown
                  assignment={assignment}
                  onView={onView}
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

export default AssignmentsTable;