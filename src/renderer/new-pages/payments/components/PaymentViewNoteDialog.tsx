// src/renderer/pages/payments/components/PaymentViewNoteDialog.tsx
import React from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";

interface PaymentViewNoteDialogProps {
  isOpen: boolean;
  payment: any | null;
  onClose: () => void;
}

const PaymentViewNoteDialog: React.FC<PaymentViewNoteDialogProps> = ({
  isOpen,
  payment,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Note">
      <div className="space-y-4">
        <p className="whitespace-pre-wrap">{payment?.notes || "No note."}</p>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentViewNoteDialog;