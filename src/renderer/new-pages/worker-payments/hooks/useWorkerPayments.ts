// src/renderer/pages/worker-payments/hooks/useWorkerPayments.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import workerPaymentAPI, { type WorkerWithStats } from "../../../api/utils/worker_payment";

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

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await workerPaymentAPI.getAll();
      if (!response.status) throw new Error(response.message);
      setAllWorkers(response.data);
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