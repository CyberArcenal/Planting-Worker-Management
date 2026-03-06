// src/renderer/pages/assignments/components/AssignmentViewNoteDialog.tsx
import React from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";

interface AssignmentViewNoteDialogProps {
  isOpen: boolean;
  assignment: any | null;
  onClose: () => void;
}

const AssignmentViewNoteDialog: React.FC<AssignmentViewNoteDialogProps> = ({
  isOpen,
  assignment,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assignment Note">
      <div className="space-y-4">
        <p className="whitespace-pre-wrap">{assignment?.notes || "No note."}</p>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AssignmentViewNoteDialog;