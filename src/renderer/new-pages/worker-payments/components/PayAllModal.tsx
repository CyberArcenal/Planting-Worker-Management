// src/renderer/pages/worker-payments/components/PayAllModal.tsx
import React, { useState } from "react";
import { formatCurrency } from "../../../utils/formatters";
import { dialogs } from "../../../utils/dialogs";
import type { WorkerWithStats } from "../hooks/useWorkerPayments";
import Modal from "../../../components/UI/Modal";
import paymentAPI from "../../../api/core/payment";
import Button from "../../../components/UI/Button";

interface PayAllModalProps {
  isOpen: boolean;
  worker: WorkerWithStats | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PayAllModal: React.FC<PayAllModalProps> = ({
  isOpen,
  worker,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  if (!worker) return null;

  const handlePayAll = async () => {
    const confirmed = await dialogs.confirm({
      title: "Confirm Payment",
      message: `Pay all pending amount ${formatCurrency(worker.pendingAmount)} to ${worker.name}?`,
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      // Create a single payment record for the total pending amount
      // Note: This assumes you have a default session, pitak, etc. You may need to adjust.
      // For simplicity, we use a placeholder pitakId and sessionId; in real app, you'd select or use default.
      const paymentData = {
        workerId: worker.id,
        pitakId: 1, // TODO: get from context or settings
        sessionId: 1, // TODO: get from context or settings
        grossPay: worker.pendingAmount,
        netPay: worker.pendingAmount,
        status: "complete",
        paymentDate: new Date().toISOString().split("T")[0],
      };
      await paymentAPI.create(paymentData);
      dialogs.success("Payment recorded successfully.");
      onSuccess();
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pay All Pending" size="md">
      <div className="space-y-4">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          You are about to pay all pending amount for <strong>{worker.name}</strong>.
        </p>
        <div
          className="p-3 rounded-md"
          style={{ backgroundColor: "var(--card-secondary-bg)" }}
        >
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Pending Amount:</span>
            <span className="font-medium" style={{ color: "var(--accent-blue)" }}>
              {formatCurrency(worker.pendingAmount)}
            </span>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-color)]">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handlePayAll}
            disabled={loading || worker.pendingAmount <= 0}
          >
            {loading ? "Processing..." : "Confirm Payment"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PayAllModal;