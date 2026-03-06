// components/History/components/DebtHistoryItem.tsx
import React, { type JSX } from "react";
import {
  ChevronUp,
  ChevronDown,
  Clock,
  CreditCard,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  User,
} from "lucide-react";
import { type DebtHistory } from "../../../api/core/debt_history";
import { formatCurrency, formatDateTime } from "../../../utils/formatters";

interface DebtHistoryItemProps {
  record: DebtHistory;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const getTransactionIcon = (transactionType: string) => {
  const icons: Record<string, JSX.Element> = {
    payment: <CreditCard className="w-5 h-5 text-green-600" />,
    adjustment: <TrendingUp className="w-5 h-5 text-blue-600" />,
    interest: <TrendingDown className="w-5 h-5 text-yellow-600" />,
    refund: <RefreshCw className="w-5 h-5 text-purple-600" />,
  };
  return icons[transactionType] || <Clock className="w-5 h-5 text-gray-600" />;
};

const getTransactionConfig = (transactionType: string) => {
  const map: Record<string, { label: string; bg: string }> = {
    payment: { label: "Debt Payment", bg: "bg-green-50" },
    adjustment: { label: "Balance Adjustment", bg: "bg-blue-50" },
    interest: { label: "Interest Applied", bg: "bg-yellow-50" },
    refund: { label: "Refund Issued", bg: "bg-purple-50" },
  };
  return map[transactionType] || { label: transactionType, bg: "bg-gray-50" };
};

const DebtHistoryItem: React.FC<DebtHistoryItemProps> = ({
  record,
  isExpanded,
  onToggleExpand,
}) => {
  const config = getTransactionConfig(record.transactionType);
  const worker = record.debt?.worker;
  const workerName = worker ? worker.name : "Unknown Worker";

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div
        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bg}`}>
              {getTransactionIcon(record.transactionType)}
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
                    {record.paymentMethod && (
                      <span className="text-sm text-gray-500">
                        Method: {record.paymentMethod}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {formatCurrency(record.amountPaid)}
              </div>
              <div className="text-xs text-gray-500">
                {formatDateTime(record.transactionDate)}
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
              <h5 className="text-sm font-medium text-gray-700 mb-2">Transaction Details</h5>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount Paid:</span>
                  <span className="font-medium text-green-600">{formatCurrency(record.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Previous Balance:</span>
                  <span className="font-medium">{formatCurrency(record.previousBalance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">New Balance:</span>
                  <span className="font-medium">{formatCurrency(record.newBalance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Balance Change:</span>
                  <span className={`font-medium ${record.previousBalance > record.newBalance ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(record.previousBalance - record.newBalance)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Metadata</h5>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Worker:</span>
                  <span className="font-medium">{workerName}</span>
                </div>
                {worker?.id && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Worker ID:</span>
                    <span className="font-medium">{worker.id}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Reference:</span>
                  <span className="font-medium">{record.referenceNumber || "N/A"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Transaction Date:</span>
                  <span className="font-medium">{formatDateTime(record.transactionDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Created:</span>
                  <span className="font-medium">{formatDateTime(record.createdAt)}</span>
                </div>
                {record.notes && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-500">Notes:</span>
                    <p className="text-sm mt-1">{record.notes}</p>
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

export default DebtHistoryItem;