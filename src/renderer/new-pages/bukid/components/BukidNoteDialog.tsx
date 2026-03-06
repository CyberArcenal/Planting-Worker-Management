// src/renderer/pages/bukid/components/BukidNoteDialog.tsx
import React, { useState, useEffect } from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";
import { dialogs } from "../../../utils/dialogs";
import bukidAPI from "../../../api/core/bukid";
import { showSuccess } from "../../../utils/notification";

interface BukidNoteDialogProps {
  isOpen: boolean;
  bukid: { id: number; name: string; notes?: string | null } | null;
  onClose: () => void;
  onSuccess: () => void;
}

const BukidNoteDialog: React.FC<BukidNoteDialogProps> = ({
  isOpen,
  bukid,
  onClose,
  onSuccess,
}) => {
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (bukid) {
      setNotes(bukid.notes || "");
    }
  }, [bukid]);

  const handleSubmit = async () => {
    if (!bukid) return;
    try {
      setSubmitting(true);
      await bukidAPI.update(bukid.id, { notes });
      showSuccess("Notes updated successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!bukid) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Notes for ${bukid.name}`} size="md">
      <div className="space-y-4">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          className="w-full p-2 border rounded"
          placeholder="Enter notes..."
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Save Notes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BukidNoteDialog;