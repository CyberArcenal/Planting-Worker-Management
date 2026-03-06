// src/renderer/pages/sessions/components/SessionNoteDialog.tsx
import React, { useState, useEffect } from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";
import sessionAPI from "../../../api/core/session";
import { showSuccess, showError } from "../../../utils/notification";

interface SessionNoteDialogProps {
  isOpen: boolean;
  session: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

const SessionNoteDialog: React.FC<SessionNoteDialogProps> = ({
  isOpen,
  session,
  onClose,
  onSuccess,
}) => {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      setNotes(session.notes || "");
    }
  }, [session]);

  const handleSave = async () => {
    if (!session) return;
    setLoading(true);
    try {
      await sessionAPI.update(session.id, { notes });
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
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Session Note">
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

export default SessionNoteDialog;