// src/renderer/pages/workers/hooks/useWorkerView.ts
import { useState, useCallback } from "react";
import workerAPI from "../../../api/core/worker";
import { showError } from "../../../utils/notification";
import type { Worker } from "../../../api/core/worker";
export const useWorkerView = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [worker, setWorker] = useState<Worker | null>(null);

  const open = useCallback(async (id: number) => {
    setIsOpen(true);
    setLoading(true);
    try {
      const response = await workerAPI.getById(id);
      if (!response.status) throw new Error(response.message);
      setWorker(response.data);
    } catch (err: any) {
      showError(err.message || "Failed to load worker details");
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setWorker(null);
  }, []);

  return {
    isOpen,
    loading,
    worker,
    open,
    close,
  };
};