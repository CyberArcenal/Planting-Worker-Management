// src/renderer/pages/debts/components/DebtsTable.tsx
import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { Debt } from "../../../api/core/debt";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import DebtActionsDropdown from "./DebtActionsDropdown";

interface DebtsTableProps {
  debts: Debt[];
  selectedDebts: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  onView: (debt: Debt) => void;
  onEdit: (debt: Debt) => void;
  onDelete: (debt: Debt) => void;
}

const DebtsTable: React.FC<DebtsTableProps> = ({
  debts,
  selectedDebts,
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
      pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
      partially_paid: { bg: "bg-blue-100", text: "text-blue-700" },
      paid: { bg: "bg-green-100", text: "text-green-700" },
      cancelled: { bg: "bg-gray-100", text: "text-gray-700" },
      overdue: { bg: "bg-red-100", text: "text-red-700" },
      settled: { bg: "bg-purple-100", text: "text-purple-700" },
    };
    const config = statusMap[status] || { bg: "bg-gray-100", text: "text-gray-700" };
    const display = status === "partially_paid" ? "Partially Paid" : 
                    status === "overdue" ? "Overdue" :
                    status.charAt(0).toUpperCase() + status.slice(1);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {display}
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
                checked={debts.length > 0 && selectedDebts.length === debts.length}
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
              onClick={() => onSort("amount")}
            >
              <div className="flex items-center gap-xs">
                <span>Amount</span>
                {getSortIcon("amount")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("balance")}
            >
              <div className="flex items-center gap-xs">
                <span>Balance</span>
                {getSortIcon("balance")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("dateIncurred")}
            >
              <div className="flex items-center gap-xs">
                <span>Date Incurred</span>
                {getSortIcon("dateIncurred")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("dueDate")}
            >
              <div className="flex items-center gap-xs">
                <span>Due Date</span>
                {getSortIcon("dueDate")}
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
              className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody style={{ backgroundColor: "var(--card-bg)" }}>
          {debts.map((debt) => (
            <tr
              key={debt.id}
              onClick={(e) => { e.stopPropagation(); onView(debt); }}
              className={`hover:bg-[var(--card-secondary-bg)] transition-colors ${
                selectedDebts.includes(debt.id) ? "bg-[var(--accent-blue-dark)]" : ""
              }`}
              style={{ borderBottom: "1px solid var(--border-color)" }}
            >
              <td className="px-2 py-2 whitespace-nowrap">
                <input
                  type="checkbox"
                  onClick={(e) => e.stopPropagation()}
                  checked={selectedDebts.includes(debt.id)}
                  onChange={() => onToggleSelect(debt.id)}
                  className="h-3 w-3 rounded border-gray-300"
                  style={{ color: "var(--accent-blue)" }}
                />
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium" style={{ color: "var(--sidebar-text)" }}>
                {debt.worker?.name || "-"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {formatCurrency(debt.amount)}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {formatCurrency(debt.balance)}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {formatDate(debt.dateIncurred, "MMM dd, yyyy")}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {debt.dueDate ? formatDate(debt.dueDate, "MMM dd, yyyy") : "-"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {getStatusBadge(debt.status)}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {debt.session?.name || "-"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                <DebtActionsDropdown
                  debt={debt}
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

export default DebtsTable;