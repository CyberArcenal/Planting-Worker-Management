// src/renderer/pages/debt-history/components/DebtHistoryNoteDialog.tsx
import React, { useState, useEffect } from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";
import debtHistoryAPI from "../../../api/core/debt_history";
import { showSuccess, showError } from "../../../utils/notification";

interface DebtHistoryNoteDialogProps {
  isOpen: boolean;
  history: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DebtHistoryNoteDialog: React.FC<DebtHistoryNoteDialogProps> = ({
  isOpen,
  history,
  onClose,
  onSuccess,
}) => {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (history) {
      setNotes(history.notes || "");
    }
  }, [history]);

  const handleSave = async () => {
    if (!history) return;
    setLoading(true);
    try {
      await debtHistoryAPI.update(history.id, { notes });
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
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Debt History Note">
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

export default DebtHistoryNoteDialog;