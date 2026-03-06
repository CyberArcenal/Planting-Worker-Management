// src/renderer/pages/assignments/hooks/useAssignmentFormDialog.ts
import { useState } from 'react';

export const useAssignmentFormDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pitakId, setPitakId] = useState<number | null>(null)
  const [workerIds, setWorkerIds] = useState<number[]>([]);
  const [isReassignment, setIsReassignment] = useState(false);
  const [reassignmentAssignmentId, setReassignmentAssignmentId] = useState<number | undefined>();

  const openAdd = (selectedWorkerIds: number[] = [], pitakId: number| null = null) => {
    setWorkerIds(selectedWorkerIds);
    setIsReassignment(false);
    setReassignmentAssignmentId(undefined);
    setIsOpen(true);
    setPitakId(pitakId)
  };

  const openReassign = (assignmentId: number, selectedWorkerIds: number[]) => {
    setWorkerIds(selectedWorkerIds);
    setIsReassignment(true);
    setReassignmentAssignmentId(assignmentId);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setWorkerIds([]);
    setIsReassignment(false);
    setReassignmentAssignmentId(undefined);
  };

  return {
    isOpen,
    workerIds,
    pitakId,
    isReassignment,
    reassignmentAssignmentId,
    openAdd,
    openReassign,
    close,
  };
};