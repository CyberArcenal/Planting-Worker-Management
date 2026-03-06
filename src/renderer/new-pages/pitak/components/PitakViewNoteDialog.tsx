// src/renderer/pages/pitak/components/PitakViewNoteDialog.tsx
import React from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";

interface PitakViewNoteDialogProps {
  isOpen: boolean;
  pitak: any | null;
  onClose: () => void;
}

const PitakViewNoteDialog: React.FC<PitakViewNoteDialogProps> = ({
  isOpen,
  pitak,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pitak Note">
      <div className="space-y-4">
        <p className="whitespace-pre-wrap">{pitak?.notes || "No note."}</p>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PitakViewNoteDialog;