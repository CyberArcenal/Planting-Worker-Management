// src/renderer/pages/debts/components/DebtReasonDialog.tsx
import React, { useState, useEffect } from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";
import debtAPI from "../../../api/core/debt";
import { showSuccess, showError } from "../../../utils/notification";

interface DebtReasonDialogProps {
  isOpen: boolean;
  debt: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DebtReasonDialog: React.FC<DebtReasonDialogProps> = ({
  isOpen,
  debt,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (debt) {
      setReason(debt.reason || "");
    }
  }, [debt]);

  const handleSave = async () => {
    if (!debt) return;
    setLoading(true);
    try {
      await debtAPI.update(debt.id, { reason });
      showSuccess("Reason updated successfully.");
      onSuccess();
      onClose();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Debt Reason">
      <div className="space-y-4">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="w-full border rounded-md p-2"
          placeholder="Enter reason for debt..."
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

export default DebtReasonDialog;