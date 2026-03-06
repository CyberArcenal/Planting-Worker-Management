// src/renderer/pages/payment-history/components/PaymentHistoriesTable.tsx
import React from "react";
import { ChevronUp, ChevronDown, FileText, Mail, Edit, Eye, Trash2 } from "lucide-react";
import type { PaymentHistory } from "../../../api/core/payment_history";
import { formatDate } from "../../../utils/formatters";
import PaymentHistoryActionsDropdown from "./PaymentHistoryActionsDropdown";

interface PaymentHistoriesTableProps {
  histories: PaymentHistory[];
  selectedHistories: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  onView: (history: PaymentHistory) => void;
  onDelete: (history: PaymentHistory) => void;
  // Optional additional actions
  onEdit?: (history: PaymentHistory) => void;
  onAddNote?: (history: PaymentHistory) => void;
  onViewNote?: (history: PaymentHistory) => void;
  onSendReceipt?: (history: PaymentHistory) => void;
}

const PaymentHistoriesTable: React.FC<PaymentHistoriesTableProps> = ({
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
  onSendReceipt,
}) => {
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="icon-sm" />
    ) : (
      <ChevronDown className="icon-sm" />
    );
  };

  const getActionTypeBadge = (type: string) => {
    const typeMap: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      create: { bg: "bg-green-100", text: "text-green-700", icon: <span className="mr-1">➕</span> },
      update: { bg: "bg-blue-100", text: "text-blue-700", icon: <span className="mr-1">✏️</span> },
      status_change: { bg: "bg-yellow-100", text: "text-yellow-700", icon: <span className="mr-1">🔄</span> },
      adjustment: { bg: "bg-purple-100", text: "text-purple-700", icon: <span className="mr-1">⚖️</span> },
      deduction: { bg: "bg-orange-100", text: "text-orange-700", icon: <span className="mr-1">💸</span> },
      debt_deduction: { bg: "bg-pink-100", text: "text-pink-700", icon: <span className="mr-1">📉</span> },
    };
    const config = typeMap[type] || { bg: "bg-gray-100", text: "text-gray-700", icon: null };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {type}
      </span>
    );
  };

  const formatValue = (val: string | number | null | undefined) => {
    if (val === null || val === undefined) return "-";
    if (typeof val === "number") return val.toLocaleString();
    return val;
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
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("payment")}
            >
              <div className="flex items-center gap-1">
                <span>Payment</span>
                {getSortIcon("payment")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              Action
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              Changes
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("changeDate")}
            >
              <div className="flex items-center gap-1">
                <span>Date</span>
                {getSortIcon("changeDate")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("performedBy")}
            >
              <div className="flex items-center gap-1">
                <span>By</span>
                {getSortIcon("performedBy")}
              </div>
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
                  Payment: {history.payment?.id || "-"}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap align-top">
                <div className="text-sm font-medium" style={{ color: "var(--sidebar-text)" }}>
                  {history.payment?.worker?.name || "-"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {history.payment?.pitak?.location || ""}
                </div>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="mb-2">
                  {getActionTypeBadge(history.actionType)}
                </div>
                {history.changedField && (
                  <div className="text-xs text-gray-600">
                    Field: <span className="font-medium">{history.changedField}</span>
                  </div>
                )}
              </td>
              <td className="px-4 py-4 align-top">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 w-12">Old:</span>
                    <span className="font-mono text-gray-700 bg-gray-50 px-2 py-0.5 rounded">
                      {formatValue(history.oldValue) || formatValue(history.oldAmount) || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 w-12">New:</span>
                    <span className="font-mono text-gray-700 bg-gray-50 px-2 py-0.5 rounded">
                      {formatValue(history.newValue) || formatValue(history.newAmount) || "-"}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap align-top">
                <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {formatDate(history.changeDate, "MMM dd, yyyy")}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDate(history.changeDate, "HH:mm")}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap align-top">
                <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {history.performedBy || "system"}
                </div>
                {history.notes && (
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span className="truncate max-w-[100px]">{history.notes}</span>
                  </div>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-right align-top">
                <PaymentHistoryActionsDropdown
                  history={history}
                  onView={onView}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onAddNote={onAddNote}
                  onViewNote={onViewNote}
                  onSendReceipt={onSendReceipt}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentHistoriesTable;