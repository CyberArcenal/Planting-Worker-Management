// src/renderer/pages/worker-payments/components/PayDebtModal.tsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Button from "../../../components/UI/Button";
import Modal from "../../../components/UI/Modal";
import { dialogs } from "../../../utils/dialogs";
import { formatCurrency } from "../../../utils/formatters";
import workerPaymentAPI, { type WorkerWithStats } from "../../../api/utils/worker_payment";

interface PayDebtModalProps {
  isOpen: boolean;
  worker: WorkerWithStats | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  amount: number;
}

const PayDebtModal: React.FC<PayDebtModalProps> = ({
  isOpen,
  worker,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { amount: 0 },
  });

  const amount = watch("amount");

  useEffect(() => {
    if (isOpen && worker) {
      reset({ amount: 0 });
      setPaymentMethod("cash");
      setNotes("");
    }
  }, [isOpen, worker, reset]);

  if (!worker) return null;

  const maxAmount = Math.min(worker.pendingAmount, worker.totalDebt);

  const onSubmit = async (data: FormData) => {
    if (data.amount <= 0) {
      dialogs.error("Amount must be positive.");
      return;
    }
    if (data.amount > maxAmount) {
      dialogs.error(`Amount cannot exceed ${formatCurrency(maxAmount)}.`);
      return;
    }

    const confirmed = await dialogs.confirm({
      title: "Confirm Debt Payment",
      message: `Pay ${formatCurrency(data.amount)} towards debt for ${worker.name}? This will be deducted from pending payments.`,
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await workerPaymentAPI.payDebt({
        workerId: worker.id,
        amount: data.amount,
        paymentMethod,
        notes: notes || undefined,
      });
      if (response.status) {
        dialogs.success("Debt payment applied successfully.");
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
    <Modal isOpen={isOpen} onClose={onClose} title="Pay Debt" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Apply payment from pending earnings to reduce debt for <strong>{worker.name}</strong>.
        </p>

        <div
          className="p-3 rounded-md space-y-2"
          style={{ backgroundColor: "var(--card-secondary-bg)" }}
        >
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Pending Amount:</span>
            <span className="font-medium" style={{ color: "var(--accent-blue)" }}>
              {formatCurrency(worker.pendingAmount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Total Debt:</span>
            <span className="font-medium" style={{ color: "var(--accent-orange)" }}>
              {formatCurrency(worker.totalDebt)}
            </span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span style={{ color: "var(--text-secondary)" }}>Maximum payable:</span>
            <span style={{ color: "var(--accent-green)" }}>{formatCurrency(maxAmount)}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Payment Amount *</label>
          <input
            type="number"
            step="0.01"
            {...register("amount", {
              required: "Amount is required",
              min: { value: 0.01, message: "Minimum amount is 0.01" },
              max: { value: maxAmount, message: `Cannot exceed ${formatCurrency(maxAmount)}` },
            })}
            className="compact-input w-full border rounded-md"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--border-color)",
              color: "var(--sidebar-text)",
            }}
          />
          {errors.amount && (
            <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>
          )}
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
          <Button type="submit" variant="success" disabled={loading}>
            {loading ? "Processing..." : "Pay Debt"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PayDebtModal;