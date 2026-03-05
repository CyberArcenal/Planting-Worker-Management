// src/renderer/pages/debt-history/components/DebtHistoryViewDialog.tsx
import React from "react";
import { History, Calendar, User, FileText, DollarSign, CreditCard } from "lucide-react";
import { useDebtHistoryView } from "../hooks/useDebtHistoryView";
import Modal from "../../../components/UI/Modal";
import { formatCurrency, formatDate } from "../../../utils/formatters";

interface DebtHistoryViewDialogProps {
  hook: ReturnType<typeof useDebtHistoryView>;
}

const DebtHistoryViewDialog: React.FC<DebtHistoryViewDialogProps> = ({ hook }) => {
  const { isOpen, loading, history, close } = hook;

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={close} title="Debt History Details" size="lg">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-blue)]"></div>
        </div>
      ) : history ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[var(--card-secondary-bg)] rounded-md flex items-center justify-center">
                <History className="w-6 h-6 text-[var(--text-tertiary)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--sidebar-text)]">
                  History Entry #{history.id}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {formatDate(history.transactionDate, "MMMM dd, yyyy HH:mm:ss")}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left column: Transaction details */}
            <div className="space-y-4">
              <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                  <DollarSign className="w-4 h-4 mr-1" /> Transaction Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Transaction Type:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{history.transactionType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Amount Paid:</span>
                    <span className="font-medium text-green-600">{formatCurrency(history.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Previous Balance:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{formatCurrency(history.previousBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">New Balance:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{formatCurrency(history.newBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Payment Method:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{history.paymentMethod || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Reference Number:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{history.referenceNumber || "-"}</span>
                  </div>
                  {history.notes && (
                    <div className="flex gap-2">
                      <span className="text-[var(--text-secondary)]">Notes:</span>
                      <span className="font-medium text-[var(--sidebar-text)]">{history.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column: Related entities */}
            <div className="space-y-4">
              {/* Related Debt */}
              {history.debt && (
                <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                    <DollarSign className="w-4 h-4 mr-1" /> Related Debt
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="font-medium text-[var(--sidebar-text)]">Debt #{history.debt.id}</div>
                    <div className="text-[var(--text-secondary)]">
                      Worker: {history.debt.worker?.name || "-"}
                    </div>
                    <div className="text-[var(--text-secondary)]">
                      Amount: {formatCurrency(history.debt.amount)}
                    </div>
                    <div className="text-[var(--text-secondary)]">
                      Balance: {formatCurrency(history.debt.balance)}
                    </div>
                  </div>
                </div>
              )}

              {/* Related Payment */}
              {history.payment && (
                <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                    <CreditCard className="w-4 h-4 mr-1" /> Related Payment
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="font-medium text-[var(--sidebar-text)]">Payment #{history.payment.id}</div>
                    <div className="text-[var(--text-secondary)]">
                      Amount: {formatCurrency(history.payment.amount)}
                    </div>
                    <div className="text-[var(--text-secondary)]">
                      Date: {history.payment.paymentDate ? formatDate(history.payment.paymentDate) : "-"}
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                  <Calendar className="w-4 h-4 mr-1" /> Timeline
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Transaction Date:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{formatDate(history.transactionDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Record Created:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{formatDate(history.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center py-4 text-[var(--text-secondary)]">History entry not found.</p>
      )}
    </Modal>
  );
};

export default DebtHistoryViewDialog;