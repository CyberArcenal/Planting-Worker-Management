// src/renderer/pages/payments/components/PaymentViewDialog.tsx
import React from "react";
import { DollarSign, Calendar, FileText, User, MapPin, Layers, CreditCard } from "lucide-react";
import { usePaymentView } from "../hooks/usePaymentView";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import Modal from "../../../components/UI/Modal";

interface PaymentViewDialogProps {
  hook: ReturnType<typeof usePaymentView>;
}

const PaymentViewDialog: React.FC<PaymentViewDialogProps> = ({ hook }) => {
  const { isOpen, loading, payment, close } = hook;

  if (!isOpen) return null;

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
    <Modal isOpen={isOpen} onClose={close} title="Payment Details" size="lg">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-blue)]"></div>
        </div>
      ) : payment ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[var(--card-secondary-bg)] rounded-md flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[var(--text-tertiary)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--sidebar-text)]">
                  Payment #{payment.id}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Created {formatDate(payment.createdAt)}
                </p>
              </div>
            </div>
            <div>{getStatusBadge(payment.status)}</div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left column: Payment details */}
            <div className="space-y-4">
              <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                  <DollarSign className="w-4 h-4 mr-1" /> Payment Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Gross Pay:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{formatCurrency(payment.grossPay)}</span>
                  </div>
                  {payment.manualDeduction ? (
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Manual Deduction:</span>
                      <span className="font-medium text-red-600">{formatCurrency(payment.manualDeduction)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Net Pay:</span>
                    <span className="font-medium text-green-600">{formatCurrency(payment.netPay)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Total Debt Deduction:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{formatCurrency(payment.totalDebtDeduction)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Other Deductions:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{formatCurrency(payment.otherDeductions || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                  <CreditCard className="w-4 h-4 mr-1" /> Transaction Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Payment Date:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">
                      {payment.paymentDate ? formatDate(payment.paymentDate) : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Payment Method:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">
                      {payment.paymentMethod || "-"}
                    </span>
                  </div>
                  {payment.referenceNumber && (
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Reference:</span>
                      <span className="font-medium text-[var(--sidebar-text)]">{payment.referenceNumber}</span>
                    </div>
                  )}
                  {(payment.periodStart || payment.periodEnd) && (
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Period:</span>
                      <span className="font-medium text-[var(--sidebar-text)]">
                        {payment.periodStart ? formatDate(payment.periodStart) : "?"} - {payment.periodEnd ? formatDate(payment.periodEnd) : "?"}
                      </span>
                    </div>
                  )}
                  {payment.notes && (
                    <div className="flex gap-2">
                      <span className="text-[var(--text-secondary)]">Notes:</span>
                      <span className="font-medium text-[var(--sidebar-text)]">{payment.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column: Related entities */}
            <div className="space-y-4">
              {payment.worker && (
                <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                    <User className="w-4 h-4 mr-1" /> Worker
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="font-medium text-[var(--sidebar-text)]">{payment.worker.name}</div>
                    {payment.worker.contact && (
                      <div className="text-[var(--text-secondary)]">Contact: {payment.worker.contact}</div>
                    )}
                  </div>
                </div>
              )}

              {payment.pitak && (
                <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                    <MapPin className="w-4 h-4 mr-1" /> Pitak
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="font-medium text-[var(--sidebar-text)]">{payment.pitak.location}</div>
                    <div className="text-[var(--text-secondary)]">
                      Bukid: {payment.pitak.bukid?.name || "-"}
                    </div>
                  </div>
                </div>
              )}

              {payment.session && (
                <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                    <Layers className="w-4 h-4 mr-1" /> Session
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="font-medium text-[var(--sidebar-text)]">{payment.session.name}</div>
                    <div className="text-[var(--text-secondary)]">Year: {payment.session.year}</div>
                  </div>
                </div>
              )}

              {payment.assignment && (
                <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                    <FileText className="w-4 h-4 mr-1" /> Related Assignment
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="text-[var(--text-secondary)]">Luwang: {payment.assignment.luwangCount}</div>
                    <div className="text-[var(--text-secondary)]">Date: {formatDate(payment.assignment.assignmentDate)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* History section if available */}
          {payment.history && payment.history.length > 0 && (
            <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
              <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                <FileText className="w-4 h-4 mr-1" /> Payment History
              </h4>
              <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
                {payment.history.map((h) => (
                  <div key={h.id} className="border-b border-[var(--border-color)] pb-1 mb-1">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">{formatDate(h.changeDate)}</span>
                      <span className="font-medium">{h.actionType}</span>
                    </div>
                    {h.notes && <div className="text-xs text-[var(--text-tertiary)]">{h.notes}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center py-4 text-[var(--text-secondary)]">Payment not found.</p>
      )}
    </Modal>
  );
};

export default PaymentViewDialog;