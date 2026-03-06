// src/renderer/pages/debts/components/DebtViewReasonDialog.tsx
import React from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";

interface DebtViewReasonDialogProps {
  isOpen: boolean;
  debt: any | null;
  onClose: () => void;
}

const DebtViewReasonDialog: React.FC<DebtViewReasonDialogProps> = ({
  isOpen,
  debt,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Debt Reason">
      <div className="space-y-4">
        <p className="whitespace-pre-wrap">{debt?.reason || "No reason provided."}</p>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DebtViewReasonDialog;