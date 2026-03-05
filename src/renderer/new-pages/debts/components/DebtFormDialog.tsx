// src/renderer/pages/debts/components/DebtFormDialog.tsx
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import debtAPI, { type Debt } from "../../../api/core/debt";
import sessionAPI, { type Session } from "../../../api/core/session";
import workerAPI from "../../../api/core/worker";
import Button from "../../../components/UI/Button";
import Modal from "../../../components/UI/Modal";
import { dialogs } from "../../../utils/dialogs";
import type { Worker } from "../../../api/core/worker";
import { useDefaultSessionId } from "../../../utils/config/farmConfig";
import WorkerSelect from "../../../components/Selects/Worker";
interface DebtFormDialogProps {
  isOpen: boolean;
  mode: "add" | "edit";
  debtId: number | null;
  initialData: Partial<Debt> | null;
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  workerId: number;
  sessionId: number;
  amount: number;
  originalAmount?: number;
  reason: string;
  dueDate: string;
  paymentTerm: string;
  interestRate: number;
  status: "pending" | "partially_paid" | "paid" | "cancelled" | "overdue" | "settled";
};

const DebtFormDialog: React.FC<DebtFormDialogProps> = ({
  isOpen,
  mode,
  debtId,
  initialData,
  onClose,
  onSuccess,
}) => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const session = useDefaultSessionId();

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      workerId: 0,
      sessionId: session,
      amount: 0,
      originalAmount: undefined,
      reason: "",
      dueDate: "",
      paymentTerm: "",
      interestRate: 0,
      status: "pending",
    },
  });

  // Load dropdown options
  useEffect(() => {
    if (isOpen) {
      setLoadingOptions(true);
      Promise.all([
        workerAPI.getAll({ limit: 100 }),
        sessionAPI.getAll({ limit: 100 }),
      ])
        .then(([workersRes, sessionsRes]) => {
          if (workersRes.status) setWorkers(workersRes.data);
          if (sessionsRes.status) setSessions(sessionsRes.data);
        })
        .catch((err) => dialogs.error(err.message))
        .finally(() => setLoadingOptions(false));
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (initialData) {
      reset({
        workerId: initialData.worker?.id || 0,
        sessionId: initialData.session?.id || 0,
        amount: initialData.amount || 0,
        originalAmount: initialData.originalAmount,
        reason: initialData.reason || "",
        dueDate: initialData.dueDate?.split("T")[0] || "",
        paymentTerm: initialData.paymentTerm || "",
        interestRate: initialData.interestRate || 0,
        status: initialData.status as any || "pending",
      });
    } else {
      reset({
        workerId: 0,
        sessionId: 0,
        amount: 0,
        originalAmount: undefined,
        reason: "",
        dueDate: "",
        paymentTerm: "",
        interestRate: 0,
        status: "pending",
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (mode === "add") {
        if (!data.workerId) throw new Error("Worker is required");
        if (!data.sessionId) throw new Error("Session is required");
        if (data.amount <= 0) throw new Error("Amount must be positive");

        await debtAPI.create({
          workerId: data.workerId,
          sessionId: data.sessionId,
          amount: data.amount,
          originalAmount: data.originalAmount || data.amount,
          reason: data.reason || undefined,
          dueDate: data.dueDate || undefined,
          paymentTerm: data.paymentTerm || undefined,
          interestRate: data.interestRate,
          status: data.status,
        });
        dialogs.success("Debt created successfully");
      } else {
        if (!debtId) throw new Error("Debt ID missing");
        await debtAPI.update(debtId, {
          workerId: data.workerId,
          sessionId: data.sessionId,
          amount: data.amount,
          originalAmount: data.originalAmount,
          reason: data.reason || undefined,
          dueDate: data.dueDate || undefined,
          paymentTerm: data.paymentTerm || undefined,
          interestRate: data.interestRate,
          status: data.status,
        });
        dialogs.success("Debt updated successfully");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      dialogs.error(err.message || "Failed to save debt");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      safetyClose={true}
      onClose={onClose}
      title={mode === "add" ? "Add Debt" : "Edit Debt"}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Worker */}
           <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--sidebar-text)" }}
              >
                Worker *
              </label>
              <Controller
                name="workerId"
                control={control}
                rules={{ required: "Worker is required" }}
                render={({ field }) => (
                  <WorkerSelect
                    value={field.value}
                    onChange={(workerId) => field.onChange(workerId)}
                    placeholder="Search or select a worker..."
                    disabled={loadingOptions}
                  />
                )}
              />
              {errors.workerId && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.workerId.message}
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--sidebar-text)" }}
              >
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                {...register("amount", {
                  required: "Amount is required",
                  valueAsNumber: true,
                  min: { value: 0.01, message: "Amount must be positive" },
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
               {/* Reason */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--sidebar-text)" }}
              >
                Reason
              </label>
              <input
                {...register("reason")}
                className="compact-input w-full border rounded-md"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--border-color)",
                  color: "var(--sidebar-text)",
                }}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
         

            {/* Due Date */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--sidebar-text)" }}
              >
                Due Date
              </label>
              <input
                type="date"
                {...register("dueDate")}
                className="compact-input w-full border rounded-md"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--border-color)",
                  color: "var(--sidebar-text)",
                }}
              />
            </div>

            {/* Payment Term */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--sidebar-text)" }}
              >
                Payment Term
              </label>
              <input
                {...register("paymentTerm")}
                className="compact-input w-full border rounded-md"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--border-color)",
                  color: "var(--sidebar-text)",
                }}
                placeholder="e.g., 30 days"
              />
            </div>

            {/* Interest Rate */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--sidebar-text)" }}
              >
                Interest Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                {...register("interestRate", { valueAsNumber: true })}
                className="compact-input w-full border rounded-md"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--border-color)",
                  color: "var(--sidebar-text)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-color)]">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="success" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : mode === "add" ? "Create" : "Update"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DebtFormDialog;