// src/renderer/pages/assignments/hooks/useAssignmentView.ts
import { useState, useCallback } from "react";
import type { Assignment } from "../../../api/core/assignment";
import assignmentAPI from "../../../api/core/assignment";
import { showError } from "../../../utils/notification";

export const useAssignmentView = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);

  const open = useCallback(async (id: number) => {
    setIsOpen(true);
    setLoading(true);
    try {
      const response = await assignmentAPI.getById(id);
      if (!response.status) throw new Error(response.message);
      setAssignment(response.data);
    } catch (err: any) {
      showError(err.message || "Failed to load assignment details");
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setAssignment(null);
  }, []);

  return {
    isOpen,
    loading,
    assignment,
    open,
    close,
  };
};