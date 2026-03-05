// src/renderer/pages/sessions/hooks/useSessionView.ts
import { useState, useCallback } from "react";
import type { Session } from "../../../api/core/session";
import { showError } from "../../../utils/notification";
import sessionAPI from "../../../api/core/session";

export const useSessionView = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  const open = useCallback(async (id: number) => {
    setIsOpen(true);
    setLoading(true);
    try {
      const response = await sessionAPI.getById(id);
      if (!response.status) throw new Error(response.message);
      setSession(response.data);
    } catch (err: any) {
      showError(err.message || "Failed to load session details");
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSession(null);
  }, []);

  return {
    isOpen,
    loading,
    session,
    open,
    close,
  };
};