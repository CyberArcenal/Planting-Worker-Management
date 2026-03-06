// src/renderer/pages/sessions/components/SessionFormDialog.tsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { Session } from "../../../api/core/session";
import sessionAPI from "../../../api/core/session";
import Button from "../../../components/UI/Button";
import Modal from "../../../components/UI/Modal";
import { dialogs } from "../../../utils/dialogs";

interface SessionFormDialogProps {
  isOpen: boolean;
  mode: "add" | "edit";
  sessionId: number | null;
  initialData: Partial<Session> | null;
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  name: string;
  seasonType: "tag-ulan" | "tag-araw" | "custom" | "";
  year: number;
  startDate: string;
  endDate: string;
  status: "active" | "closed" | "archived";
  notes: string;
};

const SessionFormDialog: React.FC<SessionFormDialogProps> = ({
  isOpen,
  mode,
  sessionId,
  initialData,
  onClose,
  onSuccess,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      seasonType: "",
      year: new Date().getFullYear(),
      startDate: "",
      endDate: "",
      status: "active",
      notes: "",
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        seasonType: (initialData.seasonType as any) || "",
        year: initialData.year || new Date().getFullYear(),
        startDate: initialData.startDate?.split("T")[0] || "",
        endDate: initialData.endDate?.split("T")[0] || "",
        status: initialData.status as any || "active",
        notes: initialData.notes || "",
      });
    } else {
      reset({
        name: "",
        seasonType: "",
        year: new Date().getFullYear(),
        startDate: "",
        endDate: "",
        status: "active",
        notes: "",
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (mode === "add") {
        if (!data.name) throw new Error("Name is required");
        if (!data.startDate) throw new Error("Start date is required");
        await sessionAPI.create({
          name: data.name,
          seasonType: data.seasonType || undefined,
          year: data.year,
          startDate: data.startDate,
          endDate: data.endDate || undefined,
          status: data.status,
          notes: data.notes || undefined,
        });
        dialogs.success("Session created successfully");
      } else {
        if (!sessionId) throw new Error("Session ID missing");
        await sessionAPI.update(sessionId, {
          name: data.name,
          seasonType: data.seasonType || undefined,
          year: data.year,
          startDate: data.startDate,
          endDate: data.endDate || undefined,
          status: data.status,
          notes: data.notes || undefined,
        });
        dialogs.success("Session updated successfully");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      dialogs.error(err.message || "Failed to save session");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      safetyClose={true}
      onClose={onClose}
      title={mode === "add" ? "Add Session" : "Edit Session"}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--sidebar-text)" }}
              >
                Name *
              </label>
              <input
                {...register("name", { required: "Name is required" })}
                className="compact-input w-full border rounded-md"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--border-color)",
                  color: "var(--sidebar-text)",
                }}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Season Type */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--sidebar-text)" }}
              >
                Season Type
              </label>
              <select
                {...register("seasonType")}
                className="compact-input w-full border rounded-md"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--border-color)",
                  color: "var(--sidebar-text)",
                }}
              >
                <option value="">Select Season</option>
                <option value="tag-ulan">Tag-ulan</option>
                <option value="tag-araw">Tag-araw</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Year */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--sidebar-text)" }}
              >
                Year *
              </label>
              <input
                type="number"
                {...register("year", { 
                  required: "Year is required",
                  valueAsNumber: true,
                  min: { value: 2000, message: "Year must be 2000 or later" },
                  max: { value: 2100, message: "Year must be 2100 or earlier" }
                })}
                className="compact-input w-full border rounded-md"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--border-color)",
                  color: "var(--sidebar-text)",
                }}
              />
              {errors.year && (
                <p className="text-xs text-red-500 mt-1">{errors.year.message}</p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Start Date */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--sidebar-text)" }}
              >
                Start Date *
              </label>
              <input
                type="date"
                {...register("startDate", { required: "Start date is required" })}
                className="compact-input w-full border rounded-md"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--border-color)",
                  color: "var(--sidebar-text)",
                }}
              />
              {errors.startDate && (
                <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--sidebar-text)" }}
              >
                End Date
              </label>
              <input
                type="date"
                {...register("endDate")}
                className="compact-input w-full border rounded-md"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--border-color)",
                  color: "var(--sidebar-text)",
                }}
              />
            </div>

            {/* Status */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--sidebar-text)" }}
              >
                Status
              </label>
              <select
                {...register("status")}
                className="compact-input w-full border rounded-md"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--border-color)",
                  color: "var(--sidebar-text)",
                }}
              >
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes (full width) */}
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

export default SessionFormDialog;