// components/Payment/hooks/usePaymentData.ts
import { useState, useCallback, useEffect, useMemo } from "react";
import type { Payment, PaymentStats } from "../../../api/core/payment";
import paymentAPI from "../../../api/core/payment";
import { showError } from "../../../utils/notification";


export const usePaymentData = () => {
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [workerFilter, setWorkerFilter] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("paymentDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [selectedPayments, setSelectedPayments] = useState<number[]>([]);

  // Fetch all payments with backend filters (except paymentMethod)
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page: 1, limit: 1000 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (workerFilter) params.workerId = workerFilter;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;

      const response = await paymentAPI.getAll(params);
      if (response.status) {
        setAllPayments(response.data);
      } else {
        throw new Error(response.message || "Failed to fetch payments");
      }
    } catch (err: any) {
      setError(err.message);
      showError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, workerFilter, dateFrom, dateTo]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await paymentAPI.getStats();
      if (response.status) setStats(response.data);
    } catch (err) {
      console.error("Failed to fetch payment stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [fetchPayments, fetchStats]);

  // Client‑side filtering & sorting
  const filteredPayments = useMemo(() => {
    let filtered = allPayments;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.worker?.name?.toLowerCase().includes(q) ||
          p.referenceNumber?.toLowerCase().includes(q) ||
          p.notes?.toLowerCase().includes(q)
      );
    }
    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter((p) => p.paymentMethod === paymentMethodFilter);
    }
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case "paymentDate":
          aVal = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
          bVal = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
          break;
        case "grossPay":
          aVal = a.grossPay;
          bVal = b.grossPay;
          break;
        case "netPay":
          aVal = a.netPay;
          bVal = b.netPay;
          break;
        default:
          aVal = a.id;
          bVal = b.id;
      }
      if (aVal === bVal) return 0;
      const compare = aVal > bVal ? 1 : -1;
      return sortOrder === "asc" ? compare : -compare;
    });
    return filtered;
  }, [allPayments, searchQuery, paymentMethodFilter, sortBy, sortOrder]);

  const totalItems = filteredPayments.length;
  const totalPages = Math.ceil(totalItems / limit);
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filteredPayments.slice(start, start + limit);
  }, [filteredPayments, currentPage, limit]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, workerFilter, dateFrom, dateTo, paymentMethodFilter, sortBy, sortOrder]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPayments(), fetchStats()]);
  };

  const summary = useMemo(() => {
    const totalGross = filteredPayments.reduce((sum, p) => sum + p.grossPay, 0);
    const totalNet = filteredPayments.reduce((sum, p) => sum + p.netPay, 0);
    const totalDeductions = filteredPayments.reduce(
      (sum, p) => sum + (p.totalDebtDeduction + (p.manualDeduction || 0) + (p.otherDeductions || 0)),
      0
    );
    return { totalGross, totalNet, totalDeductions };
  }, [filteredPayments]);

  return {
    payments: paginatedPayments,
    allPayments: filteredPayments,
    stats,
    summary,
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
    paymentMethodFilter,
    setPaymentMethodFilter,
    viewMode,
    setViewMode,
    selectedPayments,
    setSelectedPayments,
    fetchPayments,
    handleRefresh,
    setCurrentPage,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    limit,
  };
};