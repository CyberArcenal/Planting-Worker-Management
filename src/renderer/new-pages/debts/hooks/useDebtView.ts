// src/renderer/pages/debts/hooks/useDebtView.ts
import { useState, useCallback } from "react";
import type { Debt } from "../../../api/core/debt";
import debtAPI from "../../../api/core/debt";
import { showError } from "../../../utils/notification";

export const useDebtView = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debt, setDebt] = useState<Debt | null>(null);

  const open = useCallback(async (id: number) => {
    setIsOpen(true);
    setLoading(true);
    try {
      const response = await debtAPI.getById(id);
      if (!response.status) throw new Error(response.message);
      setDebt(response.data);
    } catch (err: any) {
      showError(err.message || "Failed to load debt details");
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setDebt(null);
  }, []);

  return {
    isOpen,
    loading,
    debt,
    open,
    close,
  };
};