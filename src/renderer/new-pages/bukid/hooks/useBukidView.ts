// src/renderer/pages/bukid/hooks/useBukidView.ts
import { useState, useCallback } from "react";
import type { Bukid } from "../../../api/core/bukid";
import bukidAPI from "../../../api/core/bukid";
import type { Pitak } from "../../../api/core/pitak";
import { showError } from "../../../utils/notification";
import pitakAPI from "../../../api/core/pitak";

export const useBukidView = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bukid, setBukid] = useState<Bukid | null>(null);
  const [pitaks, setPitaks] = useState<Pitak[]>([]);
  const [loadingPitaks, setLoadingPitaks] = useState(false);

  const open = useCallback(async (id: number) => {
    setIsOpen(true);
    setLoading(true);
    try {
      const response = await bukidAPI.getById(id);
      if (!response.status) throw new Error(response.message);
      setBukid(response.data);
      // Optionally fetch pitaks later when tab is selected
    } catch (err: any) {
      showError(err.message || "Failed to load bukid details");
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPitaks = useCallback(async () => {
    if (!bukid) return;
    if (pitaks.length > 0) return; // already loaded
    setLoadingPitaks(true);
    try {
      const response = await pitakAPI.getByBukid(bukid.id, { limit: 50 });
      if (response.status) {
        setPitaks(response.data);
      }
    } catch (err: any) {
      showError(err.message || "Failed to load pitaks");
    } finally {
      setLoadingPitaks(false);
    }
  }, [bukid, pitaks.length]);

  const close = useCallback(() => {
    setIsOpen(false);
    setBukid(null);
    setPitaks([]);
  }, []);

  return {
    isOpen,
    loading,
    bukid,
    pitaks,
    loadingPitaks,
    open,
    fetchPitaks,
    close,
  };
};
