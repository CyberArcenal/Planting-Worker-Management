// src/renderer/pages/payment-history/components/PaymentHistoryViewDialog.tsx
import React from "react";
import { History, Calendar, User, FileText, DollarSign } from "lucide-react";
import { usePaymentHistoryView } from "../hooks/usePaymentHistoryView";
import Modal from "../../../components/UI/Modal";
import { formatCurrency, formatDate } from "../../../utils/formatters";

interface PaymentHistoryViewDialogProps {
  hook: ReturnType<typeof usePaymentHistoryView>;
}

const PaymentHistoryViewDialog: React.FC<PaymentHistoryViewDialogProps> = ({ hook }) => {
  const { isOpen, loading, history, close } = hook;

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={close} title="Payment History Details" size="lg">
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
                  {formatDate(history.changeDate, "MMMM dd, yyyy HH:mm:ss")}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left column: Action details */}
            <div className="space-y-4">
              <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                  <FileText className="w-4 h-4 mr-1" /> Action Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Action Type:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{history.actionType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Changed Field:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{history.changedField || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Performed By:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{history.performedBy || "-"}</span>
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

            {/* Right column: Value changes */}
            <div className="space-y-4">
              <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                  <DollarSign className="w-4 h-4 mr-1" /> Value Changes
                </h4>
                <div className="space-y-2 text-sm">
                  {history.oldAmount !== null && history.newAmount !== null ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Old Amount:</span>
                        <span className="font-medium text-[var(--sidebar-text)]">
                          {history.oldAmount !== null ? formatCurrency(history.oldAmount) : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">New Amount:</span>
                        <span className="font-medium text-[var(--sidebar-text)]">
                          {history.newAmount !== null ? formatCurrency(history.newAmount) : "-"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Old Value:</span>
                        <span className="font-medium text-[var(--sidebar-text)]">{history.oldValue || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">New Value:</span>
                        <span className="font-medium text-[var(--sidebar-text)]">{history.newValue || "-"}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Related Payment */}
              {history.payment && (
                <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                    <DollarSign className="w-4 h-4 mr-1" /> Related Payment
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="font-medium text-[var(--sidebar-text)]">Payment #{history.payment.id}</div>
                    <div className="text-[var(--text-secondary)]">
                      Worker: {history.payment.worker?.name || "-"}
                    </div>
                    <div className="text-[var(--text-secondary)]">
                      Net Pay: {formatCurrency(history.payment.netPay)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center py-4 text-[var(--text-secondary)]">History entry not found.</p>
      )}
    </Modal>
  );
};

export default PaymentHistoryViewDialog;