// src/renderer/pages/audit/hooks/useAuditView.ts
import { useState } from 'react';
import auditLogAPI from '../../../api/core/audit';
import type { AuditLogEntry } from '../../../api/core/audit';

export const useAuditView = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<AuditLogEntry | null>(null);

  const open = async (id: number) => {
    setIsOpen(true);
    setLoading(true);
    try {
      const response = await auditLogAPI.getById(id);
      if (response.status) {
        setLog(response.data);
      } else {
        setLog(null);
      }
    } catch (error) {
      setLog(null);
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setIsOpen(false);
    setLog(null);
  };

  return {
    isOpen,
    loading,
    log,
    open,
    close,
  };
};