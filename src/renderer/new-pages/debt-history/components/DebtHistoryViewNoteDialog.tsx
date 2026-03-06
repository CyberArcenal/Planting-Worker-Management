// src/renderer/pages/debt-history/components/DebtHistoryViewNoteDialog.tsx
import React from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";

interface DebtHistoryViewNoteDialogProps {
  isOpen: boolean;
  history: any | null;
  onClose: () => void;
}

const DebtHistoryViewNoteDialog: React.FC<DebtHistoryViewNoteDialogProps> = ({
  isOpen,
  history,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Debt History Note">
      <div className="space-y-4">
        <p className="whitespace-pre-wrap">{history?.notes || "No note."}</p>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DebtHistoryViewNoteDialog;