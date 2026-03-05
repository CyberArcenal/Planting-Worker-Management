// src/renderer/pages/assignments/hooks/useAssignmentForm.ts
import { useState } from "react";
import type { Assignment } from "../../../api/core/assignment";

export const useAssignmentForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [assignmentId, setAssignmentId] = useState<number | null>(null);
  const [initialData, setInitialData] = useState<Partial<Assignment> | null>(null);

  const openAdd = () => {
    setMode("add");
    setAssignmentId(null);
    setInitialData(null);
    setIsOpen(true);
  };

  const openEdit = (assignment: Assignment) => {
    setMode("edit");
    setAssignmentId(assignment.id);
    setInitialData(assignment);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setAssignmentId(null);
    setInitialData(null);
  };

  return {
    isOpen,
    mode,
    assignmentId,
    initialData,
    openAdd,
    openEdit,
    close,
  };
};