// src/renderer/pages/sessions/hooks/useSessionForm.ts
import { useState } from "react";
import type { Session } from "../../../api/core/session";

export const useSessionForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [initialData, setInitialData] = useState<Partial<Session> | null>(null);

  const openAdd = () => {
    setMode("add");
    setSessionId(null);
    setInitialData(null);
    setIsOpen(true);
  };

  const openEdit = (session: Session) => {
    setMode("edit");
    setSessionId(session.id);
    setInitialData(session);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setSessionId(null);
    setInitialData(null);
  };

  return {
    isOpen,
    mode,
    sessionId,
    initialData,
    openAdd,
    openEdit,
    close,
  };
};