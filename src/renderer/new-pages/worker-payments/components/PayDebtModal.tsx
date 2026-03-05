// src/renderer/pages/worker-payments/components/PayDebtModal.tsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import debtAPI from "../../../api/core/debt";
import debtHistoryAPI from "../../../api/core/debt_history";
import Button from "../../../components/UI/Button";
import Modal from "../../../components/UI/Modal";
import { dialogs } from "../../../utils/dialogs";
import { formatCurrency } from "../../../utils/formatters";
import type { WorkerWithStats } from "../hooks/useWorkerPayments";

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
  const [debts, setDebts] = useState<any[]>([]);
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
      // Fetch worker's active debts
      debtAPI.getAll({ workerId: worker.id, status: "pending" })
        .then(res => {
          if (res.status) setDebts(res.data);
        })
        .catch(console.error);
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
      // For simplicity, we'll apply the payment to the first pending debt (or distribute proportionally)
      // In a real app, you might have a strategy. Here we just pay the first debt.
      const debtToPay = debts[0];
      if (!debtToPay) throw new Error("No active debt found.");

      const newBalance = debtToPay.balance - data.amount;
      const amountPaid = data.amount;

      // Create debt history
      await debtHistoryAPI.create({
        debtId: debtToPay.id,
        amountPaid,
        previousBalance: debtToPay.balance,
        newBalance,
        transactionType: "PAYMENT",
        notes: `Debt payment via worker payment page`,
      });

      // Update debt balance (optional, backend might auto-update via history trigger)
      // If not, we need to update debt manually
      await debtAPI.update(debtToPay.id, { balance: newBalance });

      dialogs.success("Debt payment recorded.");
      onSuccess();
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
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--sidebar-text)" }}
          >
            Payment Amount *
          </label>
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