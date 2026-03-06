// src/renderer/pages/pitak/components/PitakNoteDialog.tsx
import React, { useState, useEffect } from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";
import pitakAPI from "../../../api/core/pitak";
import { showSuccess, showError } from "../../../utils/notification";

interface PitakNoteDialogProps {
  isOpen: boolean;
  pitak: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PitakNoteDialog: React.FC<PitakNoteDialogProps> = ({
  isOpen,
  pitak,
  onClose,
  onSuccess,
}) => {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pitak) {
      setNotes(pitak.notes || "");
    }
  }, [pitak]);

  const handleSave = async () => {
    if (!pitak) return;
    setLoading(true);
    try {
      await pitakAPI.update(pitak.id, { notes });
      showSuccess("Note updated successfully.");
      onSuccess();
      onClose();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Pitak Note">
      <div className="space-y-4">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full border rounded-md p-2"
          placeholder="Add a note..."
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PitakNoteDialog;