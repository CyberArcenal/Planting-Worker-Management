// components/History/hooks/useHistoryData.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import type { HistoryType, HistoryFilters } from "../types/history.types";
import paymentHistoryAPI from "../../../api/core/payment_history";
import debtHistoryAPI from "../../../api/core/debt_history";
import type { PaymentHistory } from "../../../api/core/payment_history";
import type { DebtHistory } from "../../../api/core/debt_history";

interface UseHistoryDataReturn {
  paymentHistory: PaymentHistory[];
  debtHistory: DebtHistory[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  totalItems: number;
  refresh: () => Promise<void>;
}

export const useHistoryData = (
  viewType: HistoryType,
  filters: HistoryFilters,
  currentPage: number,
  limit: number,
): UseHistoryDataReturn => {
  const [allPaymentHistory, setAllPaymentHistory] = useState<PaymentHistory[]>([]);
  const [allDebtHistory, setAllDebtHistory] = useState<DebtHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (viewType === "payment") {
        // Fetch payment history with date range
        const params: any = {};
        if (filters.dateFrom) params.startDate = filters.dateFrom;
        if (filters.dateTo) params.endDate = filters.dateTo;
        // Note: actionType filtering is done client-side
        const response = await paymentHistoryAPI.getAll(params);
        if (response.status) {
          setAllPaymentHistory(response.data);
        } else {
          throw new Error(response.message || "Failed to fetch payment history");
        }
      } else {
        // Fetch debt history with date range and transactionType (if provided)
        const params: any = {};
        if (filters.dateFrom) params.startDate = filters.dateFrom;
        if (filters.dateTo) params.endDate = filters.dateTo;
        if (filters.transactionType !== "all") {
          params.transactionType = filters.transactionType;
        }
        const response = await debtHistoryAPI.getAll(params);
        if (response.status) {
          setAllDebtHistory(response.data);
        } else {
          throw new Error(response.message || "Failed to fetch debt history");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch history data");
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  }, [viewType, filters.dateFrom, filters.dateTo, filters.transactionType]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ---------- Client‑side filtering ----------
  const filteredData = useMemo(() => {
    if (viewType === "payment") {
      let filtered = allPaymentHistory;

      // Filter by workerId
      if (filters.workerId) {
        filtered = filtered.filter(
          (item) => item.payment?.worker?.id === filters.workerId
        );
      }

      // Filter by transactionType (actionType)
      if (filters.transactionType !== "all") {
        filtered = filtered.filter(
          (item) => item.actionType.toLowerCase() === filters.transactionType.toLowerCase()
        );
      }

      // Search query
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.payment?.worker?.name?.toLowerCase().includes(q) ||
            item.notes?.toLowerCase().includes(q) ||
            item.referenceNumber?.toLowerCase().includes(q) ||
            item.performedBy?.toLowerCase().includes(q)
        );
      }

      // Sort by changeDate (newest first)
      filtered.sort((a, b) => new Date(b.changeDate).getTime() - new Date(a.changeDate).getTime());
      return filtered;
    } else {
      let filtered = allDebtHistory;

      // Filter by workerId
      if (filters.workerId) {
        filtered = filtered.filter(
          (item) => item.debt?.worker?.id === filters.workerId
        );
      }

      // Filter by transactionType (already applied at API if not "all")
      if (filters.transactionType !== "all") {
        filtered = filtered.filter(
          (item) => item.transactionType === filters.transactionType
        );
      }

      // Search query
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.debt?.worker?.name?.toLowerCase().includes(q) ||
            item.notes?.toLowerCase().includes(q) ||
            item.referenceNumber?.toLowerCase().includes(q) ||
            item.paymentMethod?.toLowerCase().includes(q)
        );
      }

      // Sort by transactionDate (newest first)
      filtered.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
      return filtered;
    }
  }, [viewType, allPaymentHistory, allDebtHistory, filters]);

  // Pagination
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / limit);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filteredData.slice(start, start + limit);
  }, [filteredData, currentPage, limit]);

  const refresh = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    paymentHistory: viewType === "payment" ? (paginatedData as PaymentHistory[]) : [],
    debtHistory: viewType === "debt" ? (paginatedData as DebtHistory[]) : [],
    loading,
    error,
    totalPages,
    totalItems,
    refresh,
  };
};