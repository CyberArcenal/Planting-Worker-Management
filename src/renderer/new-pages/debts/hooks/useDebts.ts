// src/renderer/pages/debts/hooks/useDebts.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import type { Debt } from "../../../api/core/debt";
import debtAPI from "../../../api/core/debt";

export interface DebtFilters {
  search: string;
  status: "all" | "pending" | "partially_paid" | "paid" | "cancelled" | "overdue" | "settled";
  workerId: number | "all";
  sessionId: number | "all";
  dueDateStart?: string;
  dueDateEnd?: string;
}

export const useDebts = () => {
  const [allDebts, setAllDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DebtFilters>({
    search: "",
    status: "all",
    workerId: "all",
    sessionId: "all",
    dueDateStart: undefined,
    dueDateEnd: undefined,
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "dateIncurred",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedDebts, setSelectedDebts] = useState<number[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await debtAPI.getAll();
      if (response.status) {
        setAllDebts(response.data);
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

  const filteredDebts = useMemo(() => {
    let filtered = allDebts.filter((d) => {
      // search by worker name, reason, notes
      if (filters.search) {
        const term = filters.search.toLowerCase();
        const workerName = d.worker?.name?.toLowerCase() || "";
        const reason = d.reason?.toLowerCase() || "";
        if (!workerName.includes(term) && !reason.includes(term)) {
          return false;
        }
      }
      // status filter
      if (filters.status !== "all" && d.status !== filters.status) return false;
      // worker filter
      if (filters.workerId !== "all" && d.worker?.id !== filters.workerId) return false;
      // session filter
      if (filters.sessionId !== "all" && d.session?.id !== filters.sessionId) return false;
      // due date range
      if (filters.dueDateStart && d.dueDate && d.dueDate < filters.dueDateStart) return false;
      if (filters.dueDateEnd && d.dueDate && d.dueDate > filters.dueDateEnd) return false;
      return true;
    });

    // sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key as keyof Debt];
        let bVal = b[sortConfig.key as keyof Debt];
        // Handle nested fields
        if (sortConfig.key === "worker") {
          aVal = a.worker?.name || "";
          bVal = b.worker?.name || "";
        } else if (sortConfig.key === "session") {
          aVal = a.session?.name || "";
          bVal = b.session?.name || "";
        } else if (sortConfig.key === "dueDate" || sortConfig.key === "dateIncurred" || sortConfig.key === "lastPaymentDate") {
          aVal = aVal ? new Date(aVal as string).getTime() : 0;
          bVal = bVal ? new Date(bVal as string).getTime() : 0;
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
  }, [allDebts, filters, sortConfig]);

  const paginatedDebts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDebts.slice(start, start + pageSize);
  }, [filteredDebts, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredDebts.length / pageSize);

  const handleFilterChange = (key: keyof DebtFilters, value: string | number | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      status: "all",
      workerId: "all",
      sessionId: "all",
      dueDateStart: undefined,
      dueDateEnd: undefined,
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

  const toggleDebtSelection = (id: number) => {
    setSelectedDebts((prev) =>
      prev.includes(id) ? prev.filter((did) => did !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDebts.length === paginatedDebts.length) {
      setSelectedDebts([]);
    } else {
      setSelectedDebts(paginatedDebts.map((d) => d.id));
    }
  };

  return {
    debts: paginatedDebts,
    allDebts,
    filters,
    loading,
    error,
    pagination: {
      total: filteredDebts.length,
      totalPages,
    },
    selectedDebts,
    setSelectedDebts,
    sortConfig,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload: fetchAll,
    handleFilterChange,
    resetFilters,
    toggleDebtSelection,
    toggleSelectAll,
    handleSort,
  };
};