// src/renderer/pages/debt-history/hooks/useDebtHistories.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import type { DebtHistory } from "../../../api/core/debt_history";
import debtHistoryAPI from "../../../api/core/debt_history";

export interface DebtHistoryFilters {
  search: string;
  transactionType: "all" | string;
  debtId: number | "all";
  startDate?: string;
  endDate?: string;
}

export const useDebtHistories = () => {
  const [allHistories, setAllHistories] = useState<DebtHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DebtHistoryFilters>({
    search: "",
    transactionType: "all",
    debtId: "all",
    startDate: undefined,
    endDate: undefined,
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "transactionDate",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedHistories, setSelectedHistories] = useState<number[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await debtHistoryAPI.getAll();
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
      // search by notes, referenceNumber, etc.
      if (filters.search) {
        const term = filters.search.toLowerCase();
        const notes = h.notes?.toLowerCase() || "";
        const ref = h.referenceNumber?.toLowerCase() || "";
        const paymentMethod = h.paymentMethod?.toLowerCase() || "";
        if (!notes.includes(term) && !ref.includes(term) && !paymentMethod.includes(term)) {
          return false;
        }
      }
      // transaction type filter
      if (filters.transactionType !== "all" && h.transactionType !== filters.transactionType) return false;
      // debt filter
      if (filters.debtId !== "all" && h.debt?.id !== filters.debtId) return false;
      // date range
      if (filters.startDate && h.transactionDate < filters.startDate) return false;
      if (filters.endDate && h.transactionDate > filters.endDate) return false;
      return true;
    });

    // sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key as keyof DebtHistory];
        let bVal = b[sortConfig.key as keyof DebtHistory];
        if (sortConfig.key === "debt") {
          aVal = a.debt?.id || 0;
          bVal = b.debt?.id || 0;
        } else if (sortConfig.key === "transactionDate" || sortConfig.key === "createdAt") {
          aVal = a.transactionDate ? new Date(a.transactionDate).getTime() : 0;
          bVal = b.transactionDate ? new Date(b.transactionDate).getTime() : 0;
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

  const handleFilterChange = (key: keyof DebtHistoryFilters, value: string | number | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      transactionType: "all",
      debtId: "all",
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