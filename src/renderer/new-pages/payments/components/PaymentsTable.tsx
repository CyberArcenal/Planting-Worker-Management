// src/renderer/pages/payments/components/PaymentsTable.tsx
import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { Payment } from "../../../api/core/payment";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import PaymentActionsDropdown from "./PaymentActionsDropdown";

interface PaymentsTableProps {
  payments: Payment[];
  selectedPayments: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  onView: (payment: Payment) => void;
  onDelete: (payment: Payment) => void;
}

const PaymentsTable: React.FC<PaymentsTableProps> = ({
  payments,
  selectedPayments,
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
      pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
      partially_paid: { bg: "bg-blue-100", text: "text-blue-700" },
      complete: { bg: "bg-green-100", text: "text-green-700" },
      cancel: { bg: "bg-red-100", text: "text-red-700" },
    };
    const config = statusMap[status] || { bg: "bg-gray-100", text: "text-gray-700" };
    const display = status === "partially_paid" ? "Partially Paid" : 
                    status === "cancel" ? "Cancelled" :
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
                checked={payments.length > 0 && selectedPayments.length === payments.length}
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
              onClick={() => onSort("grossPay")}
            >
              <div className="flex items-center gap-xs">
                <span>Gross</span>
                {getSortIcon("grossPay")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("netPay")}
            >
              <div className="flex items-center gap-xs">
                <span>Net</span>
                {getSortIcon("netPay")}
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
              onClick={() => onSort("paymentDate")}
            >
              <div className="flex items-center gap-xs">
                <span>Payment Date</span>
                {getSortIcon("paymentDate")}
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
          {payments.map((payment) => (
            <tr
              key={payment.id}
              onClick={(e) => { e.stopPropagation(); onView(payment); }}
              className={`hover:bg-[var(--card-secondary-bg)] transition-colors ${
                selectedPayments.includes(payment.id) ? "bg-[var(--accent-blue-dark)]" : ""
              }`}
              style={{ borderBottom: "1px solid var(--border-color)" }}
            >
              <td className="px-2 py-2 whitespace-nowrap">
                <input
                  type="checkbox"
                  onClick={(e) => e.stopPropagation()}
                  checked={selectedPayments.includes(payment.id)}
                  onChange={() => onToggleSelect(payment.id)}
                  className="h-3 w-3 rounded border-gray-300"
                  style={{ color: "var(--accent-blue)" }}
                />
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium" style={{ color: "var(--sidebar-text)" }}>
                {payment.worker?.name || "-"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {payment.pitak?.location || "-"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {formatCurrency(payment.grossPay)}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {formatCurrency(payment.netPay)}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {payment.paymentDate ? formatDate(payment.paymentDate, "MMM dd, yyyy") : "-"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {getStatusBadge(payment.status)}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {payment.session?.name || "-"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                <PaymentActionsDropdown
                  payment={payment}
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

export default PaymentsTable;