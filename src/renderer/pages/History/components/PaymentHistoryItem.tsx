// components/History/components/PaymentHistoryItem.tsx
import React, { type JSX } from "react";
import {
  ChevronUp,
  ChevronDown,
  Clock,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  Edit,
  Trash2,
  CreditCard,
  User,
  FileText,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "../../../utils/formatters";
import type { PaymentHistory } from "../../../api/core/payment_history";

interface PaymentHistoryItemProps {
  record: PaymentHistory;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

// Helper to map actionType to display config
const getActionConfig = (actionType: string) => {
  const map: Record<string, { label: string; bg: string; icon: JSX.Element }> = {
    CREATE: { label: "Created", bg: "bg-green-50", icon: <PlusCircle className="w-5 h-5 text-green-600" /> },
    UPDATE: { label: "Updated", bg: "bg-yellow-50", icon: <Edit className="w-5 h-5 text-yellow-600" /> },
    DELETE: { label: "Deleted", bg: "bg-red-50", icon: <Trash2 className="w-5 h-5 text-red-600" /> },
    PAYMENT: { label: "Payment", bg: "bg-blue-50", icon: <CreditCard className="w-5 h-5 text-blue-600" /> },
    DEDUCTION: { label: "Deduction", bg: "bg-orange-50", icon: <MinusCircle className="w-5 h-5 text-orange-600" /> },
    STATUS_CHANGE: { label: "Status Changed", bg: "bg-purple-50", icon: <RefreshCw className="w-5 h-5 text-purple-600" /> },
  };
  return map[actionType] || { label: actionType, bg: "bg-gray-50", icon: <Clock className="w-5 h-5 text-gray-600" /> };
};

const PaymentHistoryItem: React.FC<PaymentHistoryItemProps> = ({
  record,
  isExpanded,
  onToggleExpand,
}) => {
  const config = getActionConfig(record.actionType);
  const worker = record.payment?.worker;
  const workerName = worker ? worker.name : "Unknown Worker";

  const amountChange = record.oldAmount !== null && record.newAmount !== null
    ? { amount: Math.abs(record.newAmount - record.oldAmount), isIncrease: record.newAmount > record.oldAmount }
    : null;

  const formatValue = (value: string | null, field: string | null) => {
    if (value === null) return "N/A";
    if (field?.includes("amount") || field?.includes("Pay")) {
      return formatCurrency(parseFloat(value));
    }
    return value;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div
        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bg}`}>
              {config.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{config.label}</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{workerName}</span>
                      {worker?.contact && (
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-500">
                          Contact: {worker.contact}
                        </span>
                      )}
                    </div>
                    {record.changedField && (
                      <span className="text-sm text-gray-500">
                        Field: {record.changedField}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              {amountChange && (
                <div className={`text-sm font-medium ${amountChange.isIncrease ? "text-green-600" : "text-red-600"}`}>
                  {amountChange.isIncrease ? "+" : "-"}{formatCurrency(amountChange.amount)}
                </div>
              )}
              <div className="text-xs text-gray-500">
                {formatDateTime(record.changeDate)}
              </div>
            </div>
            <div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Change Details
              </h5>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-100 rounded p-2">
                    <div className="text-xs text-gray-500 mb-1">Previous</div>
                    <div className="text-sm font-medium">
                      {formatValue(record.oldValue as string, record.changedField as string)}
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded p-2">
                    <div className="text-xs text-gray-500 mb-1">New</div>
                    <div className="text-sm font-medium">
                      {formatValue(record.newValue as string, record.changedField as string)}
                    </div>
                  </div>
                </div>

                {record.oldAmount !== null && record.newAmount !== null && (
                  <div className={`p-2 rounded ${amountChange?.isIncrease ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Amount Change:</span>
                      <span className={`text-sm font-bold ${amountChange?.isIncrease ? "text-green-700" : "text-red-700"}`}>
                        {amountChange?.isIncrease ? "+" : "-"}{formatCurrency(amountChange?.amount || 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Metadata
              </h5>
              <div className="space-y-3">
                <div className="bg-gray-100 rounded p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Worker:</span>
                    <span className="text-sm font-medium">{workerName} {worker?.id && `(${worker.id})`}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Performed By:</span>
                    <span className="text-sm font-medium">{record.performedBy || "System"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Timestamp:</span>
                    <span className="text-sm font-medium">{formatDateTime(record.changeDate)}</span>
                  </div>
                </div>

                {record.payment && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Payment Info</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-blue-600">Reference:</div>
                        <div className="text-sm font-medium">{record.payment.referenceNumber || "N/A"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-blue-600">Status:</div>
                        <div className="text-sm font-medium">{record.payment.status}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-blue-600">Net Pay:</div>
                        <div className="text-sm font-medium">{formatCurrency(record.payment.netPay)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {record.notes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Notes</span>
                    </div>
                    <p className="text-sm text-yellow-700">{record.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistoryItem;