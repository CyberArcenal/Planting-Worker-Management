// src/renderer/pages/assignments/components/AssignmentNoteDialog.tsx
import React, { useState, useEffect } from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";
import assignmentAPI from "../../../api/core/assignment";
import { showSuccess, showError } from "../../../utils/notification";

interface AssignmentNoteDialogProps {
  isOpen: boolean;
  assignment: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

const AssignmentNoteDialog: React.FC<AssignmentNoteDialogProps> = ({
  isOpen,
  assignment,
  onClose,
  onSuccess,
}) => {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (assignment) {
      setNotes(assignment.notes || "");
    }
  }, [assignment]);

  const handleSave = async () => {
    if (!assignment) return;
    setLoading(true);
    try {
      await assignmentAPI.update(assignment.id, { notes });
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
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Assignment Note">
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

export default AssignmentNoteDialog;