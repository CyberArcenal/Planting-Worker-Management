// src/renderer/pages/assignments/hooks/useAddAssignmentNote.ts
import { useState } from 'react';
import assignmentAPI from '../../../../../../api/core/assignment';
import { showError, showSuccess } from '../../../../../../utils/notification';

export const useAddAssignmentNote = (
  assignmentId: number,
  assignmentName: string,
  onSuccess?: () => void,
  onClose?: () => void,
  initialNoteType = 'general'
) => {
  const [note, setNote] = useState('');
  const [noteType, setNoteType] = useState(initialNoteType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setError('Note cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch current assignment to get existing notes
      const currentRes = await assignmentAPI.getById(assignmentId);
      if (!currentRes.status) throw new Error(currentRes.message);

      const currentNotes = currentRes.data.notes || '';
      const newNotes = currentNotes
        ? `${currentNotes}\n[${noteType}] ${note}`
        : `[${noteType}] ${note}`;

      // 2. Update the assignment with the new notes
      const updateRes = await assignmentAPI.update(assignmentId, { notes: newNotes });
      if (updateRes.status) {
        showSuccess('Note added successfully');
        if (onSuccess) onSuccess();
        onClose?.();
      } else {
        setError(updateRes.message || 'Failed to add note');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add note');
      showError('Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  return {
    note,
    setNote,
    noteType,
    setNoteType,
    loading,
    error,
    handleSubmit,
    assignmentName,
    onClose,
  };
};