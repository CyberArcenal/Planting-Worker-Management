// src/renderer/pages/debt-history/components/DebtHistoriesTable.tsx
import React from "react";
import { ChevronUp, ChevronDown, FileText } from "lucide-react";
import type { DebtHistory } from "../../../api/core/debt_history";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import DebtHistoryActionsDropdown from "./DebtHistoryActionsDropdown";

interface DebtHistoriesTableProps {
  histories: DebtHistory[];
  selectedHistories: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  onView: (history: DebtHistory) => void;
  onDelete: (history: DebtHistory) => void;
  // Optional additional actions
  onEdit?: (history: DebtHistory) => void;
  onAddNote?: (history: DebtHistory) => void;
  onViewNote?: (history: DebtHistory) => void;
}

const DebtHistoriesTable: React.FC<DebtHistoriesTableProps> = ({
  histories,
  selectedHistories,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  sortConfig,
  onView,
  onDelete,
  onEdit,
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

  const getTransactionTypeBadge = (type: string) => {
    const typeMap: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      payment: { bg: "bg-green-100", text: "text-green-700", icon: <span className="mr-1">💰</span> },
      adjustment: { bg: "bg-yellow-100", text: "text-yellow-700", icon: <span className="mr-1">⚖️</span> },
      interest: { bg: "bg-purple-100", text: "text-purple-700", icon: <span className="mr-1">📈</span> },
      refund: { bg: "bg-blue-100", text: "text-blue-700", icon: <span className="mr-1">↩️</span> },
    };
    const config = typeMap[type] || { bg: "bg-gray-100", text: "text-gray-700", icon: null };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {type}
      </span>
    );
  };

  return (
    <div
      className="overflow-x-auto rounded-lg border shadow-sm"
      style={{ borderColor: "var(--border-color)" }}
    >
      <table className="min-w-full border-collapse" style={{ borderColor: "var(--border-color)" }}>
        <thead style={{ backgroundColor: "var(--card-secondary-bg)" }}>
          <tr>
            <th
              scope="col"
              className="w-10 px-3 py-3 text-left text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              <input
                type="checkbox"
                onClick={(e) => e.stopPropagation()}
                checked={histories.length > 0 && selectedHistories.length === histories.length}
                onChange={onToggleSelectAll}
                className="h-4 w-4 rounded border-gray-300"
                style={{ color: "var(--accent-blue)" }}
              />
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("id")}
            >
              <div className="flex items-center gap-1">
                <span>ID</span>
                {getSortIcon("id")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              Debt
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              Transaction
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              Balance Change
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("transactionDate")}
            >
              <div className="flex items-center gap-1">
                <span>Date</span>
                {getSortIcon("transactionDate")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              Method
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody style={{ backgroundColor: "var(--card-bg)" }}>
          {histories.map((history) => (
            <tr
              key={history.id}
              onClick={(e) => { e.stopPropagation(); onView(history); }}
              className={`group hover:bg-[var(--card-secondary-bg)] transition-colors cursor-pointer ${
                selectedHistories.includes(history.id) ? "bg-[var(--accent-blue-dark)]" : ""
              }`}
              style={{ borderBottom: "1px solid var(--border-color)" }}
            >
              <td className="px-3 py-4 whitespace-nowrap align-top">
                <input
                  type="checkbox"
                  onClick={(e) => e.stopPropagation()}
                  checked={selectedHistories.includes(history.id)}
                  onChange={() => onToggleSelect(history.id)}
                  className="h-4 w-4 rounded border-gray-300"
                  style={{ color: "var(--accent-blue)" }}
                />
              </td>
              <td className="px-4 py-4 whitespace-nowrap align-top">
                <div className="text-sm font-medium" style={{ color: "var(--sidebar-text)" }}>
                  #{history.id}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Ref: {history.referenceNumber || "-"}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap align-top">
                <div className="text-sm font-medium" style={{ color: "var(--sidebar-text)" }}>
                  Debt #{history.debt?.id || "-"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {history.debt?.worker?.name || ""}
                </div>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="mb-2">
                  {getTransactionTypeBadge(history.transactionType)}
                </div>
                {history.paymentMethod && (
                  <div className="text-xs text-gray-600">
                    Method: {history.paymentMethod}
                  </div>
                )}
              </td>
              <td className="px-4 py-4 align-top">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 w-16">Paid:</span>
                    <span className="font-mono text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      {formatCurrency(history.amountPaid)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 w-16">Prev:</span>
                    <span className="font-mono text-gray-700 bg-gray-50 px-2 py-0.5 rounded">
                      {formatCurrency(history.previousBalance)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 w-16">New:</span>
                    <span className="font-mono text-gray-700 bg-gray-50 px-2 py-0.5 rounded">
                      {formatCurrency(history.newBalance)}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap align-top">
                <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {formatDate(history.transactionDate, "MMM dd, yyyy")}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDate(history.transactionDate, "HH:mm")}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap align-top">
                <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {history.paymentMethod || "-"}
                </div>
                {history.notes && (
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span className="truncate max-w-[100px]">{history.notes}</span>
                  </div>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-right align-top">
                <DebtHistoryActionsDropdown
                  history={history}
                  onView={onView}
                  onDelete={onDelete}
                  onEdit={onEdit}
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

export default DebtHistoriesTable;