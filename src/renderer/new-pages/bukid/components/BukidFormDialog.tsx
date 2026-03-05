// src/renderer/pages/bukid/components/BukidFormDialog.tsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { Bukid } from "../../../api/core/bukid";
import type { Session } from "../../../api/core/session";
import sessionAPI from "../../../api/core/session";
import { dialogs } from "../../../utils/dialogs";
import bukidAPI from "../../../api/core/bukid";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";
import {
  useDefaultSessionId,
  useFarmAssignmentSettings,
} from "../../../utils/config/farmConfig";

interface BukidFormDialogProps {
  isOpen: boolean;
  mode: "add" | "edit";
  bukidId: number | null;
  initialData: Partial<Bukid> | null;
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  name: string;
  location: string;
  status: "active" | "inactive" | "complete" | "initiated";
  notes: string;
  sessionId: number;
};

const BukidFormDialog: React.FC<BukidFormDialogProps> = ({
  isOpen,
  mode,
  bukidId,
  initialData,
  onClose,
  onSuccess,
}) => {
  const session = useDefaultSessionId();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      location: "",
      status: "active",
      notes: "",
      sessionId: 0,
    },
  });
  // Populate form when editing
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        location: initialData.location || "",
        status: (initialData.status as any) || "active",
        notes: initialData.notes || "",
        sessionId: initialData.session?.id || 0,
      });
    } else {
      reset({
        name: "",
        location: "",
        status: "active",
        notes: "",
        sessionId: session,
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (mode === "add") {
        if (!data.name) throw new Error("Bukid name is required");
        if (!data.sessionId) throw new Error("Session is required");
        await bukidAPI.create({
          name: data.name,
          location: data.location || undefined,
          status: data.status,
          notes: data.notes || undefined,
          sessionId: data.sessionId,
        });
        dialogs.success("Bukid created successfully");
      } else {
        if (!bukidId) throw new Error("Bukid ID missing");
        await bukidAPI.update(bukidId, {
          name: data.name,
          location: data.location || undefined,
          status: data.status,
          notes: data.notes || undefined,
          sessionId: data.sessionId,
        });
        dialogs.success("Bukid updated successfully");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      dialogs.error(err.message || "Failed to save bukid");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      safetyClose={true}
      onClose={onClose}
      title={mode === "add" ? "Add Bukid" : "Edit Bukid"}
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
                Bukid Name *
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
                <p className="text-xs text-red-500 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--sidebar-text)" }}
              >
                Location
              </label>
              <input
                {...register("location")}
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

export default BukidFormDialog;
