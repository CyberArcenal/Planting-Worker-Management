// src/renderer/pages/bukid/hooks/useBukidForm.ts
import { useState } from "react";
import type { Bukid } from "../../../api/core/bukid";

export const useBukidForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [bukidId, setBukidId] = useState<number | null>(null);
  const [initialData, setInitialData] = useState<Partial<Bukid> | null>(null);

  const openAdd = () => {
    setMode("add");
    setBukidId(null);
    setInitialData(null);
    setIsOpen(true);
  };

  const openEdit = (bukid: Bukid) => {
    setMode("edit");
    setBukidId(bukid.id);
    setInitialData(bukid);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setBukidId(null);
    setInitialData(null);
  };

  return {
    isOpen,
    mode,
    bukidId,
    initialData,
    openAdd,
    openEdit,
    close,
  };
};
