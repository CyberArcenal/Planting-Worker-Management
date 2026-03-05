// src/renderer/pages/debts/components/DebtViewDialog.tsx
import React from "react";
import { Receipt, Calendar, FileText, User, Layers, DollarSign } from "lucide-react";
import { useDebtView } from "../hooks/useDebtView";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import Modal from "../../../components/UI/Modal";

interface DebtViewDialogProps {
  hook: ReturnType<typeof useDebtView>;
}

const DebtViewDialog: React.FC<DebtViewDialogProps> = ({ hook }) => {
  const { isOpen, loading, debt, close } = hook;

  if (!isOpen) return null;

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
    <Modal isOpen={isOpen} onClose={close} title="Debt Details" size="lg">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-blue)]"></div>
        </div>
      ) : debt ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[var(--card-secondary-bg)] rounded-md flex items-center justify-center">
                <Receipt className="w-6 h-6 text-[var(--text-tertiary)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--sidebar-text)]">
                  Debt #{debt.id}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Created {formatDate(debt.createdAt)}
                </p>
              </div>
            </div>
            <div>{getStatusBadge(debt.status)}</div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left column: Debt details */}
            <div className="space-y-4">
              <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                  <DollarSign className="w-4 h-4 mr-1" /> Debt Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Original Amount:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">
                      {formatCurrency(debt.originalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Current Amount:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">
                      {formatCurrency(debt.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Balance:</span>
                    <span className="font-medium text-orange-600">
                      {formatCurrency(debt.balance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Total Paid:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(debt.totalPaid)}
                    </span>
                  </div>
                  {debt.reason && (
                    <div className="flex gap-2">
                      <span className="text-[var(--text-secondary)]">Reason:</span>
                      <span className="font-medium text-[var(--sidebar-text)]">{debt.reason}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Interest Rate:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{debt.interestRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Total Interest:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">
                      {formatCurrency(debt.totalInterest)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                  <Calendar className="w-4 h-4 mr-1" /> Dates
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Date Incurred:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">
                      {formatDate(debt.dateIncurred)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Due Date:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">
                      {debt.dueDate ? formatDate(debt.dueDate) : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Payment Term:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">
                      {debt.paymentTerm || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Last Payment:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">
                      {debt.lastPaymentDate ? formatDate(debt.lastPaymentDate) : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: Related entities */}
            <div className="space-y-4">
              {debt.worker && (
                <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                    <User className="w-4 h-4 mr-1" /> Worker
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="font-medium text-[var(--sidebar-text)]">{debt.worker.name}</div>
                    {debt.worker.contact && (
                      <div className="text-[var(--text-secondary)]">Contact: {debt.worker.contact}</div>
                    )}
                  </div>
                </div>
              )}

              {debt.session && (
                <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                    <Layers className="w-4 h-4 mr-1" /> Session
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="font-medium text-[var(--sidebar-text)]">{debt.session.name}</div>
                    <div className="text-[var(--text-secondary)]">Year: {debt.session.year}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* History section if available */}
          {debt.history && debt.history.length > 0 && (
            <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
              <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                <FileText className="w-4 h-4 mr-1" /> Payment History
              </h4>
              <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                {debt.history.map((h) => (
                  <div key={h.id} className="border-b border-[var(--border-color)] pb-2">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">{formatDate(h.transactionDate)}</span>
                      <span className="font-medium text-green-600">{formatCurrency(h.amountPaid)}</span>
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)]">
                      Previous: {formatCurrency(h.previousBalance)} → New: {formatCurrency(h.newBalance)}
                    </div>
                    {h.notes && <div className="text-xs text-[var(--text-tertiary)]">{h.notes}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center py-4 text-[var(--text-secondary)]">Debt not found.</p>
      )}
    </Modal>
  );
};

export default DebtViewDialog;