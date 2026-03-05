// src/renderer/pages/payments/hooks/usePaymentView.ts
import { useState, useCallback } from "react";
import type { Payment } from "../../../api/core/payment";
import { showError } from "../../../utils/notification";
import paymentAPI from "../../../api/core/payment";

export const usePaymentView = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);

  const open = useCallback(async (id: number) => {
    setIsOpen(true);
    setLoading(true);
    try {
      const response = await paymentAPI.getById(id);
      if (!response.status) throw new Error(response.message);
      setPayment(response.data);
    } catch (err: any) {
      showError(err.message || "Failed to load payment details");
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setPayment(null);
  }, []);

  return {
    isOpen,
    loading,
    payment,
    open,
    close,
  };
};