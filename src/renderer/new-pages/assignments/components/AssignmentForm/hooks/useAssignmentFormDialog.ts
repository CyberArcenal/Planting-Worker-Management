// src/renderer/pages/assignments/hooks/useAssignmentFormDialog.ts
import { useState } from 'react';

export const useAssignmentFormDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [workerIds, setWorkerIds] = useState<number[]>([]);
  const [isReassignment, setIsReassignment] = useState(false);
  const [reassignmentAssignmentId, setReassignmentAssignmentId] = useState<number | undefined>();

  const openAdd = (selectedWorkerIds: number[] = []) => {
    setWorkerIds(selectedWorkerIds);
    setIsReassignment(false);
    setReassignmentAssignmentId(undefined);
    setIsOpen(true);
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
    isReassignment,
    reassignmentAssignmentId,
    openAdd,
    openReassign,
    close,
  };
};