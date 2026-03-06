// src/renderer/pages/payment-history/components/PaymentHistoryViewNoteDialog.tsx
import React from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";

interface PaymentHistoryViewNoteDialogProps {
  isOpen: boolean;
  history: any | null;
  onClose: () => void;
}

const PaymentHistoryViewNoteDialog: React.FC<PaymentHistoryViewNoteDialogProps> = ({
  isOpen,
  history,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment History Note">
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

export default PaymentHistoryViewNoteDialog;