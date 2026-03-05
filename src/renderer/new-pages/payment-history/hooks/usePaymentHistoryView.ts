// src/renderer/pages/payment-history/hooks/usePaymentHistoryView.ts
import { useState, useCallback } from "react";
import type { PaymentHistory } from "../../../api/core/payment_history";
import paymentHistoryAPI from "../../../api/core/payment_history";
import { showError } from "../../../utils/notification";

export const usePaymentHistoryView = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PaymentHistory | null>(null);

  const open = useCallback(async (id: number) => {
    setIsOpen(true);
    setLoading(true);
    try {
      const response = await paymentHistoryAPI.getById(id);
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