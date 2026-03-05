// src/renderer/pages/payment-history/hooks/usePaymentHistories.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import type { PaymentHistory } from "../../../api/core/payment_history";
import paymentHistoryAPI from "../../../api/core/payment_history";

export interface PaymentHistoryFilters {
  search: string;
  actionType: "all" | string;
  paymentId: number | "all";
  startDate?: string;
  endDate?: string;
}

export const usePaymentHistories = () => {
  const [allHistories, setAllHistories] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaymentHistoryFilters>({
    search: "",
    actionType: "all",
    paymentId: "all",
    startDate: undefined,
    endDate: undefined,
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "changeDate",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedHistories, setSelectedHistories] = useState<number[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentHistoryAPI.getAll();
      if (response.status) {
        setAllHistories(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredHistories = useMemo(() => {
    let filtered = allHistories.filter((h) => {
      // search by notes, performedBy, etc.
      if (filters.search) {
        const term = filters.search.toLowerCase();
        const notes = h.notes?.toLowerCase() || "";
        const performedBy = h.performedBy?.toLowerCase() || "";
        const changedField = h.changedField?.toLowerCase() || "";
        if (!notes.includes(term) && !performedBy.includes(term) && !changedField.includes(term)) {
          return false;
        }
      }
      // action type filter
      if (filters.actionType !== "all" && h.actionType !== filters.actionType) return false;
      // payment filter
      if (filters.paymentId !== "all" && h.payment?.id !== filters.paymentId) return false;
      // date range
      if (filters.startDate && h.changeDate < filters.startDate) return false;
      if (filters.endDate && h.changeDate > filters.endDate) return false;
      return true;
    });

    // sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key as keyof PaymentHistory];
        let bVal = b[sortConfig.key as keyof PaymentHistory];
        if (sortConfig.key === "payment") {
          aVal = a.payment?.id || 0;
          bVal = b.payment?.id || 0;
        } else if (sortConfig.key === "changeDate") {
          aVal = a.changeDate ? new Date(a.changeDate).getTime() : 0;
          bVal = b.changeDate ? new Date(b.changeDate).getTime() : 0;
        } else if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [allHistories, filters, sortConfig]);

  const paginatedHistories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHistories.slice(start, start + pageSize);
  }, [filteredHistories, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredHistories.length / pageSize);

  const handleFilterChange = (key: keyof PaymentHistoryFilters, value: string | number | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      actionType: "all",
      paymentId: "all",
      startDate: undefined,
      endDate: undefined,
    });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  const toggleHistorySelection = (id: number) => {
    setSelectedHistories((prev) =>
      prev.includes(id) ? prev.filter((hid) => hid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedHistories.length === paginatedHistories.length) {
      setSelectedHistories([]);
    } else {
      setSelectedHistories(paginatedHistories.map((h) => h.id));
    }
  };

  return {
    histories: paginatedHistories,
    allHistories,
    filters,
    loading,
    error,
    pagination: {
      total: filteredHistories.length,
      totalPages,
    },
    selectedHistories,
    setSelectedHistories,
    sortConfig,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload: fetchAll,
    handleFilterChange,
    resetFilters,
    toggleHistorySelection,
    toggleSelectAll,
    handleSort,
  };
};