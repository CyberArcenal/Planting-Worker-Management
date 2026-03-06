// components/Debt/hooks/useDebtData.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import type { Debt, DebtStats } from "../../../api/core/debt";
import debtAPI from "../../../api/core/debt";

export const useDebtData = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // All fetched debts (raw)
  const [allDebts, setAllDebts] = useState<Debt[]>([]);
  const [stats, setStats] = useState<DebtStats | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [workerFilter, setWorkerFilter] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Sorting
  const [sortBy, setSortBy] = useState<string>("dateIncurred");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // View mode
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [selectedDebts, setSelectedDebts] = useState<number[]>([]);

  // Fetch debts with backend filters
  const fetchDebts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (workerFilter) params.workerId = workerFilter;
      if (dateFrom) params.dueDateStart = dateFrom; // adjust if your API uses dueDateStart
      if (dateTo) params.dueDateEnd = dateTo;       // adjust if your API uses dueDateEnd

      const response = await debtAPI.getAll(params);
      if (response.status) {
        setAllDebts(response.data);
      } else {
        throw new Error(response.message || "Failed to fetch debts");
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching debts:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, workerFilter, dateFrom, dateTo]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await debtAPI.getStats();
      if (response.status) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch debt stats:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDebts();
    fetchStats();
  }, [fetchDebts, fetchStats]);

  // ---------- Client‑side filtering (search) & sorting ----------
  const filteredDebts = useMemo(() => {
    let filtered = allDebts;

    // Apply search (worker name or reason)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.worker?.name?.toLowerCase().includes(q) ||
          d.reason?.toLowerCase().includes(q)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case "dateIncurred":
          aVal = new Date(a.dateIncurred).getTime();
          bVal = new Date(b.dateIncurred).getTime();
          break;
        case "amount":
          aVal = a.amount;
          bVal = b.amount;
          break;
        case "balance":
          aVal = a.balance;
          bVal = b.balance;
          break;
        case "dueDate":
          aVal = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          bVal = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          break;
        case "createdAt":
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        default:
          aVal = a.id;
          bVal = b.id;
      }
      if (aVal === bVal) return 0;
      const compare = aVal > bVal ? 1 : -1;
      return sortOrder === "asc" ? compare : -compare;
    });

    return sorted;
  }, [allDebts, searchQuery, sortBy, sortOrder]);

  // Pagination
  const totalItems = filteredDebts.length;
  const totalPages = Math.ceil(totalItems / limit);
  const paginatedDebts = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filteredDebts.slice(start, start + limit);
  }, [filteredDebts, currentPage, limit]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, workerFilter, dateFrom, dateTo]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDebts(), fetchStats()]);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setWorkerFilter(null);
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  return {
    debts: paginatedDebts,
    allDebts,
    stats,
    loading,
    refreshing,
    error,
    currentPage,
    totalPages,
    totalItems,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    workerFilter,
    setWorkerFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    viewMode,
    setViewMode,
    selectedDebts,
    setSelectedDebts,
    fetchDebts,
    handleRefresh,
    setCurrentPage,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    clearFilters,
  };
};