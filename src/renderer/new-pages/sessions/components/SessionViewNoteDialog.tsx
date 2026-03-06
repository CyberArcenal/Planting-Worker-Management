// src/renderer/pages/sessions/components/SessionViewNoteDialog.tsx
import React from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";

interface SessionViewNoteDialogProps {
  isOpen: boolean;
  session: any | null;
  onClose: () => void;
}

const SessionViewNoteDialog: React.FC<SessionViewNoteDialogProps> = ({
  isOpen,
  session,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Session Note">
      <div className="space-y-4">
        <p className="whitespace-pre-wrap">{session?.notes || "No note."}</p>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SessionViewNoteDialog;