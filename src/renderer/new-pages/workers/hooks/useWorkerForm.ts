// src/renderer/pages/workers/hooks/useWorkerForm.ts
import { useState } from "react";
import type { Worker } from "../../../api/core/worker";
export const useWorkerForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [workerId, setWorkerId] = useState<number | null>(null);
  const [initialData, setInitialData] = useState<Partial<Worker> | null>(null);

  const openAdd = () => {
    setMode("add");
    setWorkerId(null);
    setInitialData(null);
    setIsOpen(true);
  };

  const openEdit = (worker: Worker) => {
    setMode("edit");
    setWorkerId(worker.id);
    setInitialData(worker);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setWorkerId(null);
    setInitialData(null);
  };

  return {
    isOpen,
    mode,
    workerId,
    initialData,
    openAdd,
    openEdit,
    close,
  };
};