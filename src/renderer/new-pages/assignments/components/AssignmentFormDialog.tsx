// src/renderer/pages/assignments/components/AssignmentFormDialog.tsx
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { Assignment } from "../../../api/core/assignment";
import assignmentAPI from "../../../api/core/assignment";
import Button from "../../../components/UI/Button";
import Modal from "../../../components/UI/Modal";
import { dialogs } from "../../../utils/dialogs";
import { useDefaultSessionId } from "../../../utils/config/farmConfig";
import WorkerSelect from "../../../components/Selects/Worker";
import PitakSelect from "../../../components/Selects/Pitak";

interface AssignmentFormDialogProps {
  isOpen: boolean;
  mode: "add" | "edit";
  assignmentId: number | null;
  initialData: Partial<Assignment> | null;
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  workerId: number;
  pitakId: number;
  sessionId: number;
  assignmentDate: string;
  notes: string;
  status: "active" | "completed" | "cancelled";
};

const AssignmentFormDialog: React.FC<AssignmentFormDialogProps> = ({
  isOpen,
  mode,
  assignmentId,
  initialData,
  onClose,
  onSuccess,
}) => {
  const session = useDefaultSessionId();
  const [loadingOptions, setLoadingOptions] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      workerId: 0,
      pitakId: 0,
      sessionId: session,
      assignmentDate: new Date().toISOString().split("T")[0],
      notes: "",
      status: "active",
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (initialData) {
      reset({
        workerId: initialData.worker?.id || 0,
        pitakId: initialData.pitak?.id || 0,
        sessionId: initialData.session?.id || 0,
        assignmentDate:
          initialData.assignmentDate?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        notes: initialData.notes || "",
        status: (initialData.status as any) || "active",
      });
    } else {
      reset({
        workerId: 0,
        pitakId: 0,
        sessionId: session,
        assignmentDate: new Date().toISOString().split("T")[0],
        notes: "",
        status: "active",
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (mode === "add") {
        if (!data.workerId) throw new Error("Worker is required");
        if (!data.pitakId) throw new Error("Pitak is required");
        if (!data.sessionId) throw new Error("Session is required");
        await assignmentAPI.create({
          workerId: data.workerId,
          pitakId: data.pitakId,
          sessionId: data.sessionId,
          assignmentDate: data.assignmentDate,
          notes: data.notes || undefined,
          status: data.status,
        });
        dialogs.success("Assignment created successfully");
      } else {
        if (!assignmentId) throw new Error("Assignment ID missing");
        await assignmentAPI.update(assignmentId, {
          workerId: data.workerId,
          pitakId: data.pitakId,
          sessionId: data.sessionId,
          assignmentDate: data.assignmentDate,
          notes: data.notes || undefined,
          status: data.status,
        });
        dialogs.success("Assignment updated successfully");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      dialogs.error(err.message || "Failed to save assignment");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      safetyClose={true}
      onClose={onClose}
      title={mode === "add" ? "Add Assignment" : "Edit Assignment"}
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

            {/* Pitak */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--sidebar-text)" }}
              >
                Pitak *
              </label>
              <Controller
                name="pitakId"
                control={control}
                rules={{ required: "Pitak is required" }}
                render={({ field }) => (
                  <PitakSelect
                    value={field.value}
                    onChange={(pitakId) => field.onChange(pitakId)}
                    placeholder="Search or select a plot..."
                    disabled={loadingOptions}
                  />
                )}
              />
              {errors.pitakId && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.pitakId.message}
                </p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Assignment Date */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--sidebar-text)" }}
              >
                Assignment Date *
              </label>
              <input
                type="date"
                {...register("assignmentDate", {
                  required: "Date is required",
                })}
                className="compact-input w-full border rounded-md"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--border-color)",
                  color: "var(--sidebar-text)",
                }}
              />
              {errors.assignmentDate && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.assignmentDate.message}
                </p>
              )}
            </div>
            {/* Notes */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--sidebar-text)" }}
              >
                Notes
              </label>
              <textarea
                {...register("notes")}
                rows={3}
                className="compact-input w-full border rounded-md"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--border-color)",
                  color: "var(--sidebar-text)",
                }}
                placeholder="Additional notes..."
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

export default AssignmentFormDialog;
