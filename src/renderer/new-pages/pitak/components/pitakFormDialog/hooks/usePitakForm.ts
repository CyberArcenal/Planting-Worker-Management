// src/renderer/pages/pitak/hooks/usePitakForm.ts
import { useState } from 'react';
import type { Pitak } from '../../../../../api/core/pitak';

export const usePitakForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'add' | 'edit'>('add');
  const [pitakId, setPitakId] = useState<number | null>(null);
  const [initialData, setInitialData] = useState<Partial<Pitak> | null>(null);
  const [bukidId, setBukidId] = useState<number | null>(null);

  const openAdd = () => {
    setMode('add');
    setPitakId(null);
    setInitialData(null);
    setBukidId(null);
    setIsOpen(true);
  };

  const openAddWithBukid = (id: number) => {
    setMode('add');
    setPitakId(null);
    setInitialData(null);
    setBukidId(id);
    setIsOpen(true);
  };

  const openEdit = (pitak: Pitak) => {
    setMode('edit');
    setPitakId(pitak.id);
    setInitialData(pitak);
    setBukidId(null);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setPitakId(null);
    setInitialData(null);
    setBukidId(null);
  };

  return {
    isOpen,
    mode,
    pitakId,
    initialData,
    bukidId,
    openAdd,
    openAddWithBukid,
    openEdit,
    close,
  };
};