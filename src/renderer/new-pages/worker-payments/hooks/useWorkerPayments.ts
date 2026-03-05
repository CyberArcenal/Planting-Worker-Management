// src/renderer/pages/worker-payments/hooks/useWorkerPayments.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import { useFarmPaymentSettings } from "../../../utils/config/farmConfig";
import workerAPI from "../../../api/core/worker";
import paymentAPI from "../../../api/core/payment";
import debtAPI from "../../../api/core/debt";

export interface WorkerWithStats extends Worker {
  pendingAmount: number; // sum of netPay of pending/partially paid payments
  totalDebt: number; // sum of debt balances
  lastPaymentDate?: string;
}

export const useWorkerPayments = () => {
  const [allWorkers, setAllWorkers] = useState<WorkerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);

  // Modal states
  const [payAllModal, setPayAllModal] = useState<{
    isOpen: boolean;
    worker: WorkerWithStats | null;
  }>({ isOpen: false, worker: null });
  const [payDebtModal, setPayDebtModal] = useState<{
    isOpen: boolean;
    worker: WorkerWithStats | null;
  }>({ isOpen: false, worker: null });

  const { rate_per_luwang } = useFarmPaymentSettings(); // optional, might be used for future

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all workers, payments, debts
      const [workersRes, paymentsRes, debtsRes] = await Promise.all([
        workerAPI.getAll(),
        paymentAPI.getAll(),
        debtAPI.getAll(),
      ]);

      if (!workersRes.status) throw new Error(workersRes.message);
      if (!paymentsRes.status) throw new Error(paymentsRes.message);
      if (!debtsRes.status) throw new Error(debtsRes.message);

      const workers = workersRes.data;
      const payments = paymentsRes.data;
      const debts = debtsRes.data;

      // Compute stats per worker
      const workersWithStats: WorkerWithStats[] = workers.map((worker) => {
        const workerPayments = payments.filter((p) => p.worker?.id === worker.id);
        const workerDebts = debts.filter((d) => d.worker?.id === worker.id);

        // Pending amount: sum of netPay for payments with status 'pending' or 'partially_paid'
        const pendingAmount = workerPayments
          .filter((p) => p.status === "pending" || p.status === "partially_paid")
          .reduce((sum, p) => sum + p.netPay, 0);

        // Total debt balance
        const totalDebt = workerDebts.reduce((sum, d) => sum + d.balance, 0);

        // Last payment date (most recent payment with paymentDate)
        const lastPayment = workerPayments
          .filter((p) => p.paymentDate)
          .sort((a, b) => (a.paymentDate! > b.paymentDate! ? -1 : 1))[0];

        return {
          ...worker,
          pendingAmount,
          totalDebt,
          lastPaymentDate: lastPayment?.paymentDate,
        };
      });

      setAllWorkers(workersWithStats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const paginatedWorkers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allWorkers.slice(start, start + pageSize);
  }, [allWorkers, currentPage, pageSize]);

  const totalPages = Math.ceil(allWorkers.length / pageSize);

  const openPayAllModal = (worker: WorkerWithStats) => {
    setPayAllModal({ isOpen: true, worker });
  };

  const closePayAllModal = () => {
    setPayAllModal({ isOpen: false, worker: null });
  };

  const openPayDebtModal = (worker: WorkerWithStats) => {
    setPayDebtModal({ isOpen: true, worker });
  };

  const closePayDebtModal = () => {
    setPayDebtModal({ isOpen: false, worker: null });
  };

  return {
    workers: paginatedWorkers,
    allWorkers,
    loading,
    error,
    pagination: {
      total: allWorkers.length,
      totalPages,
    },
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload: fetchAll,
    selectedWorkerId,
    setSelectedWorkerId,
    payAllModal: {
      isOpen: payAllModal.isOpen,
      worker: payAllModal.worker,
      open: openPayAllModal,
      close: closePayAllModal,
    },
    payDebtModal: {
      isOpen: payDebtModal.isOpen,
      worker: payDebtModal.worker,
      open: openPayDebtModal,
      close: closePayDebtModal,
    },
  };
};