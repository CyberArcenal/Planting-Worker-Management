// src/renderer/pages/pitak/hooks/usePitakView.ts
import { useState, useCallback } from "react";
import type { Pitak } from "../../../api/core/pitak";
import pitakAPI from "../../../api/core/pitak";
import { showError } from "../../../utils/notification";

export const usePitakView = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pitak, setPitak] = useState<Pitak | null>(null);

  const open = useCallback(async (id: number) => {
    setIsOpen(true);
    setLoading(true);
    try {
      const response = await pitakAPI.getById(id);
      if (!response.status) throw new Error(response.message);
      setPitak(response.data);
    } catch (err: any) {
      showError(err.message || "Failed to load pitak details");
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setPitak(null);
  }, []);

  return {
    isOpen,
    loading,
    pitak,
    open,
    close,
  };
};