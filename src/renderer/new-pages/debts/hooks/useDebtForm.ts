// src/renderer/pages/debts/hooks/useDebtForm.ts
import { useState } from "react";
import type { Debt } from "../../../api/core/debt";

export const useDebtForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [debtId, setDebtId] = useState<number | null>(null);
  const [initialData, setInitialData] = useState<Partial<Debt> | null>(null);

  const openAdd = () => {
    setMode("add");
    setDebtId(null);
    setInitialData(null);
    setIsOpen(true);
  };

  const openEdit = (debt: Debt) => {
    setMode("edit");
    setDebtId(debt.id);
    setInitialData(debt);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setDebtId(null);
    setInitialData(null);
  };

  return {
    isOpen,
    mode,
    debtId,
    initialData,
    openAdd,
    openEdit,
    close,
  };
};