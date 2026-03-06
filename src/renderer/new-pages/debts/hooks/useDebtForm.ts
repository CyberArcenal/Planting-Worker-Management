// src/renderer/pages/debts/hooks/useDebtForm.ts
import { useState } from "react";

export const useDebtForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [debtId, setDebtId] = useState<number | null>(null);

  const openAdd = () => {
    setMode("add");
    setDebtId(null);
    setIsOpen(true);
  };

  const openEdit = (debtId:number) => {
    setMode("edit");
    setDebtId(debtId);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setDebtId(null);
  };

  return {
    isOpen,
    mode,
    debtId,
    openAdd,
    openEdit,
    close,
  };
};