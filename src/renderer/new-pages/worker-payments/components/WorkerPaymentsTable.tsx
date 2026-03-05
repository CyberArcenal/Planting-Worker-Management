// src/renderer/pages/worker-payments/components/WorkerPaymentsTable.tsx
import React from "react";
import type { WorkerWithStats } from "../hooks/useWorkerPayments";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import type { Worker } from "../../../api/core/worker";


interface WorkerPaymentsTableProps {
  workers: WorkerWithStats[];
  onPayAll: (worker: WorkerWithStats) => void;
  onPayDebt: (worker: WorkerWithStats) => void;
}

const WorkerPaymentsTable: React.FC<WorkerPaymentsTableProps> = ({
  workers,
  onPayAll,
  onPayDebt,
}) => {
  return (
    <div
      className="overflow-x-auto rounded-md border compact-table"
      style={{ borderColor: "var(--border-color)" }}
    >
      <table className="min-w-full" style={{ borderColor: "var(--border-color)" }}>
        <thead style={{ backgroundColor: "var(--card-secondary-bg)" }}>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
              Worker
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
              Contact
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
              Pending Amount
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
              Total Debt
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
              Last Payment
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody style={{ backgroundColor: "var(--card-bg)" }}>
          {workers.map((worker) => (
            <tr
              key={worker.id}
              className="hover:bg-[var(--card-secondary-bg)] transition-colors"
              style={{ borderBottom: "1px solid var(--border-color)" }}
            >
              <td className="px-4 py-2 whitespace-nowrap">
                <div className="font-medium" style={{ color: "var(--sidebar-text)" }}>
                  {worker.name}
                </div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  ID: {worker.id}
                </div>
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {worker.contact || "-"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium" style={{ color: "var(--accent-blue)" }}>
                {formatCurrency(worker.pendingAmount)}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium" style={{ color: "var(--accent-orange)" }}>
                {formatCurrency(worker.totalDebt)}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm" style={{ color: "var(--text-secondary)" }}>
                {worker.lastPaymentDate ? formatDate(worker.lastPaymentDate) : "-"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-right text-sm">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onPayAll(worker)}
                    className="px-3 py-1 text-xs rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                    disabled={worker.pendingAmount <= 0}
                  >
                    Pay All
                  </button>
                  <button
                    onClick={() => onPayDebt(worker)}
                    className="px-3 py-1 text-xs rounded-md bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
                    disabled={worker.totalDebt <= 0}
                  >
                    Pay Debt
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WorkerPaymentsTable;