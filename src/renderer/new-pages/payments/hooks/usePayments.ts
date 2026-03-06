// src/renderer/pages/payments/hooks/usePayments.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import type { Payment } from "../../../api/core/payment";
import paymentAPI from "../../../api/core/payment";

export interface PaymentFilters {
  search: string;
  status: "all" | "pending" | "partially_paid" | "completed" | "cancel";
  workerId: number | "all";
  pitakId: number | "all";
  sessionId: number | "all";
  startDate?: string;
  endDate?: string;
}

export const usePayments = () => {
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaymentFilters>({
    search: "",
    status: "all",
    workerId: "all",
    pitakId: "all",
    sessionId: "all",
    startDate: undefined,
    endDate: undefined,
  });
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "paymentDate",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPayments, setSelectedPayments] = useState<number[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentAPI.getAll();
      if (response.status) {
        setAllPayments(response.data);
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

  const filteredPayments = useMemo(() => {
    let filtered = allPayments.filter((p) => {
      // search by worker name, pitak location, notes
      if (filters.search) {
        const term = filters.search.toLowerCase();
        const workerName = p.worker?.name?.toLowerCase() || "";
        const pitakLocation = p.pitak?.location?.toLowerCase() || "";
        const notes = p.notes?.toLowerCase() || "";
        if (
          !workerName.includes(term) &&
          !pitakLocation.includes(term) &&
          !notes.includes(term)
        ) {
          return false;
        }
      }
      // status filter
      if (filters.status !== "all" && p.status !== filters.status) return false;
      // worker filter
      if (filters.workerId !== "all" && p.worker?.id !== filters.workerId)
        return false;
      // pitak filter
      if (filters.pitakId !== "all" && p.pitak?.id !== filters.pitakId)
        return false;
      // session filter
      if (filters.sessionId !== "all" && p.session?.id !== filters.sessionId)
        return false;
      // date range
      if (
        filters.startDate &&
        p.paymentDate &&
        p.paymentDate < filters.startDate
      )
        return false;
      if (filters.endDate && p.paymentDate && p.paymentDate > filters.endDate)
        return false;
      return true;
    });

    // sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key as keyof Payment];
        let bVal = b[sortConfig.key as keyof Payment];
        // Handle nested fields
        if (sortConfig.key === "worker") {
          aVal = a.worker?.name || "";
          bVal = b.worker?.name || "";
        } else if (sortConfig.key === "pitak") {
          aVal = a.pitak?.location || "";
          bVal = b.pitak?.location || "";
        } else if (sortConfig.key === "session") {
          aVal = a.session?.name || "";
          bVal = b.session?.name || "";
        } else if (sortConfig.key === "paymentDate") {
          aVal = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
          bVal = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
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
  }, [allPayments, filters, sortConfig]);

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredPayments.length / pageSize);

  const handleFilterChange = (
    key: keyof PaymentFilters,
    value: string | number | undefined,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      status: "all",
      workerId: "all",
      pitakId: "all",
      sessionId: "all",
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

  const togglePaymentSelection = (id: number) => {
    setSelectedPayments((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedPayments.length === paginatedPayments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(paginatedPayments.map((p) => p.id));
    }
  };

  return {
    payments: paginatedPayments,
    allPayments,
    filters,
    loading,
    error,
    pagination: {
      total: filteredPayments.length,
      totalPages,
    },
    selectedPayments,
    setSelectedPayments,
    sortConfig,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload: fetchAll,
    handleFilterChange,
    resetFilters,
    togglePaymentSelection,
    toggleSelectAll,
    handleSort,
  };
};
