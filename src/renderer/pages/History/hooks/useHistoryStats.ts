// components/History/hooks/useHistoryStats.ts
import { useMemo } from "react";
import type { PaymentHistory } from "../../../api/core/payment_history";
import type { DebtHistory } from "../../../api/core/debt_history";
import type { HistoryStats } from "../types/history.types";

export const useHistoryStats = (
  viewType: "payment" | "debt",
  paymentHistory: PaymentHistory[],
  debtHistory: DebtHistory[],
) => {
  const stats = useMemo<HistoryStats | null>(() => {
    if (viewType === "payment") {
      const records = paymentHistory;
      if (records.length === 0) return null;
      const totalAmount = records.reduce((sum, r) => {
        const change = (r.newAmount ?? 0) - (r.oldAmount ?? 0);
        return sum + Math.abs(change);
      }, 0);
      const workerCounts: Record<string, number> = {};
      records.forEach(r => {
        const name = r.payment?.worker?.name || "Unknown";
        workerCounts[name] = (workerCounts[name] || 0) + 1;
      });
      const mostActiveWorker = Object.entries(workerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
      const mostRecent = records[0]?.changeDate || "No records";
      return {
        totalRecords: records.length,
        totalAmount,
        averageAmount: totalAmount / records.length,
        mostActiveWorker,
        mostRecent,
        byMonth: [], // can be implemented later
        byStatus: {},
      };
    } else {
      const records = debtHistory;
      if (records.length === 0) return null;
      const totalAmount = records.reduce((sum, r) => sum + r.amountPaid, 0);
      const workerCounts: Record<string, number> = {};
      records.forEach(r => {
        const name = r.debt?.worker?.name || "Unknown";
        workerCounts[name] = (workerCounts[name] || 0) + 1;
      });
      const mostActiveWorker = Object.entries(workerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
      const mostRecent = records[0]?.transactionDate || "No records";
      return {
        totalRecords: records.length,
        totalAmount,
        averageAmount: totalAmount / records.length,
        mostActiveWorker,
        mostRecent,
        byMonth: [],
        byStatus: {},
      };
    }
  }, [viewType, paymentHistory, debtHistory]);

  return stats;
};