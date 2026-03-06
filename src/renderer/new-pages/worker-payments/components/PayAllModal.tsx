// src/renderer/pages/worker-payments/components/PayAllModal.tsx
import React, { useState } from "react";
import { formatCurrency } from "../../../utils/formatters";
import { dialogs } from "../../../utils/dialogs";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";
import type { WorkerWithStats } from "../../../api/utils/worker_payment";
import workerPaymentAPI from "../../../api/utils/worker_payment";

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
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  if (!worker) return null;

  const handlePayAll = async () => {
    const confirmed = await dialogs.confirm({
      title: "Confirm Payment",
      message: `Pay all pending amount ${formatCurrency(worker.pendingAmount)} to ${worker.name}?`,
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await workerPaymentAPI.payAll({
        workerId: worker.id,
        paymentMethod,
        notes: notes || undefined,
      });
      if (response.status) {
        dialogs.success("Payments completed successfully.");
        onSuccess();
      } else {
        dialogs.error(response.message);
      }
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

        <div>
          <label className="block text-sm font-medium mb-1">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="compact-input w-full border rounded-md"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--border-color)",
              color: "var(--sidebar-text)",
            }}
          >
            <option value="cash">Cash</option>
            <option value="gcash">GCash</option>
            <option value="bank">Bank Transfer</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="compact-input w-full border rounded-md"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--border-color)",
              color: "var(--sidebar-text)",
            }}
          />
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