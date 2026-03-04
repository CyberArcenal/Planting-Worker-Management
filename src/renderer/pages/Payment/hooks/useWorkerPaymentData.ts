// components/Payment/hooks/useWorkerPaymentData.ts
import { useState, useCallback, useEffect, useMemo } from "react";
import type { Payment } from "../../../api/core/payment";
import workerAPI from "../../../api/core/worker";
import paymentAPI from "../../../api/core/payment";
import { showError } from "../../../utils/notification";
import type { Worker } from "../../../api/core/worker";

export interface WorkerPaymentSummary {
  worker: Worker;
  totalPayments: number;
  totalGrossPay: number;
  totalNetPay: number;
  totalDeductions: number;
  pendingPayments: number;
  totalPendingAmount: number;
  processingPayments: number;
  completedPayments: number;
  cancelledPayments: number;
  partiallyPaidPayments: number;
  totalDebt: number;
  lastPaymentDate: string | null;
  paymentMethods: Set<string>;
  payments: Payment[];
  recentPayments: Payment[];
}

export const useWorkerPaymentData = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("totalNetPay");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all active workers
      const workersRes = await workerAPI.getAll({
        status: "active",
        limit: 1000,
        sortBy: "name",
        sortOrder: "ASC",
      });
      if (!workersRes.status) throw new Error(workersRes.message || "Failed to fetch workers");
      setWorkers(workersRes.data);

      // Fetch all payments within date range
      const paymentParams: any = { limit: 10000 };
      if (dateFrom) paymentParams.startDate = dateFrom;
      if (dateTo) paymentParams.endDate = dateTo;
      const paymentsRes = await paymentAPI.getAll(paymentParams);
      if (!paymentsRes.status) throw new Error(paymentsRes.message || "Failed to fetch payments");
      setAllPayments(paymentsRes.data);
    } catch (err: any) {
      setError(err.message);
      showError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group payments by worker
  const workerSummaries = useMemo(() => {
    const map = new Map<number, WorkerPaymentSummary>();

    workers.forEach((worker) => {
      map.set(worker.id, {
        worker,
        totalPayments: 0,
        totalGrossPay: 0,
        totalNetPay: 0,
        totalDeductions: 0,
        pendingPayments: 0,
        totalPendingAmount: 0,
        processingPayments: 0,
        completedPayments: 0,
        cancelledPayments: 0,
        partiallyPaidPayments: 0,
        totalDebt: 0,
        lastPaymentDate: null,
        paymentMethods: new Set(),
        payments: [],
        recentPayments: [],
      });
    });

    allPayments.forEach((payment) => {
      const workerId = payment.worker?.id;
      if (!workerId || !map.has(workerId)) return;
      const s = map.get(workerId)!;
      s.totalPayments += 1;
      s.totalGrossPay += payment.grossPay;
      s.totalNetPay += payment.netPay;
      const deductions = payment.totalDebtDeduction + (payment.manualDeduction || 0) + (payment.otherDeductions || 0);
      s.totalDeductions += deductions;
      if (payment.status === "pending") {
        s.pendingPayments += 1;
        s.totalPendingAmount += payment.netPay;
      } else if (payment.status === "processing") s.processingPayments += 1;
      else if (payment.status === "completed") s.completedPayments += 1;
      else if (payment.status === "cancelled") s.cancelledPayments += 1;
      else if (payment.status === "partially_paid") {
        s.partiallyPaidPayments += 1;
        s.totalPendingAmount += payment.netPay;
      }
      if (payment.paymentMethod) s.paymentMethods.add(payment.paymentMethod);
      if (payment.paymentDate && (!s.lastPaymentDate || payment.paymentDate > s.lastPaymentDate)) {
        s.lastPaymentDate = payment.paymentDate;
      }
      s.payments.push(payment);
    });

    map.forEach((s) => {
      s.payments.sort((a, b) => {
        const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
        const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
        return dateB - dateA;
      });
      s.recentPayments = s.payments.slice(0, 3);
    });

    return Array.from(map.values());
  }, [workers, allPayments]);

  // Apply filters and sorting
  const filteredSummaries = useMemo(() => {
    let filtered = workerSummaries;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.worker.name.toLowerCase().includes(q) ||
          s.worker.contact?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => {
        if (statusFilter === "has_pending") return s.pendingPayments > 0;
        if (statusFilter === "has_debt") return s.totalDebt > 0;
        if (statusFilter === "has_completed") return s.completedPayments > 0;
        return true;
      });
    }
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case "workerName": aVal = a.worker.name; bVal = b.worker.name; break;
        case "totalPayments": aVal = a.totalPayments; bVal = b.totalPayments; break;
        case "totalGrossPay": aVal = a.totalGrossPay; bVal = b.totalGrossPay; break;
        case "totalNetPay": aVal = a.totalNetPay; bVal = b.totalNetPay; break;
        case "totalDeductions": aVal = a.totalDeductions; bVal = b.totalDeductions; break;
        case "totalDebt": aVal = a.totalDebt; bVal = b.totalDebt; break;
        default: aVal = a.totalNetPay; bVal = b.totalNetPay;
      }
      if (aVal === bVal) return 0;
      const compare = aVal > bVal ? 1 : -1;
      return sortOrder === "asc" ? compare : -compare;
    });
    return filtered;
  }, [workerSummaries, searchQuery, statusFilter, sortBy, sortOrder]);

  const totalItems = filteredSummaries.length;
  const totalPages = Math.ceil(totalItems / limit);
  const paginatedSummaries = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filteredSummaries.slice(start, start + limit);
  }, [filteredSummaries, currentPage, limit]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFrom, dateTo, sortBy, sortOrder]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  return {
    workerSummaries: paginatedSummaries,
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
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    handleRefresh,
    limit,
    setCurrentPage,
  };
};