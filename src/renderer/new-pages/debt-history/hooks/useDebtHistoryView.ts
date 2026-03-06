// src/renderer/pages/debt-history/hooks/useDebtHistoryView.ts
import { useState, useCallback } from "react";
import type { DebtHistory } from "../../../api/core/debt_history";
import debtHistoryAPI from "../../../api/core/debt_history";
import { showError } from "../../../utils/notification";
export const useDebtHistoryView = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<DebtHistory | null>(null);

  const open = useCallback(async (id: number) => {
    setIsOpen(true);
    setLoading(true);
    try {
      const response = await debtHistoryAPI.getById(id);
      if (!response.status) throw new Error(response.message);
      setHistory(response.data);
    } catch (err: any) {
      showError(err.message || "Failed to load history details");
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setHistory(null);
  }, []);

  return {
    isOpen,
    loading,
    history,
    open,
    close,
  };
};