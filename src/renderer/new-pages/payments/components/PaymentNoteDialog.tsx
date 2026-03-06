// src/renderer/pages/payments/components/PaymentNoteDialog.tsx
import React, { useState, useEffect } from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";
import paymentAPI from "../../../api/core/payment";
import { showSuccess, showError } from "../../../utils/notification";

interface PaymentNoteDialogProps {
  isOpen: boolean;
  payment: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentNoteDialog: React.FC<PaymentNoteDialogProps> = ({
  isOpen,
  payment,
  onClose,
  onSuccess,
}) => {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (payment) {
      setNotes(payment.notes || "");
    }
  }, [payment]);

  const handleSave = async () => {
    if (!payment) return;
    setLoading(true);
    try {
      await paymentAPI.update(payment.id, { notes });
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
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Payment Note">
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

export default PaymentNoteDialog;