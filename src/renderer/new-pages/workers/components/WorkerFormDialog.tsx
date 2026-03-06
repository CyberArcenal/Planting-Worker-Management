// src/renderer/pages/workers/components/WorkerFormDialog.tsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import workerAPI from "../../../api/core/worker";
import Button from "../../../components/UI/Button";
import Modal from "../../../components/UI/Modal";
import { dialogs } from "../../../utils/dialogs";
import type { Worker } from "../../../api/core/worker";
interface WorkerFormDialogProps {
  isOpen: boolean;
  mode: "add" | "edit";
  workerId: number | null;
  initialData: Partial<Worker> | null;
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  name: string;
  contact: string;
  email: string;
  address: string;
  status: "active" | "inactive" | "on-leave" | "terminated";
  hireDate: string;
};

const WorkerFormDialog: React.FC<WorkerFormDialogProps> = ({
  isOpen,
  mode,
  workerId,
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
      contact: "",
      email: "",
      address: "",
      status: "active",
      hireDate: "",
    },
  });

  // Populate form when editing
  const normalizeDate = (value: any) => {
    if (!value) return "";
    if (typeof value === "string") return value.split("T")[0];
    if (value instanceof Date) return value.toISOString().split("T")[0];
    return "";
  };

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        contact: initialData.contact || "",
        email: initialData.email || "",
        address: initialData.address || "",
        status: initialData.status as "active" | "inactive" | "on-leave" | "terminated" | undefined || "active" ,
        hireDate: normalizeDate(initialData.hireDate),
      });
    } else {
      reset({
        name: "",
        contact: "",
        email: "",
        address: "",
        status: "active",
        hireDate: "",
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (mode === "add") {
        if (!data.name) throw new Error("Name is required");
        await workerAPI.create({
          name: data.name,
          contact: data.contact || undefined,
          email: data.email || undefined,
          address: data.address || undefined,
          status: data.status,
          hireDate: data.hireDate || undefined,
        });
        dialogs.success("Worker created successfully");
      } else {
        if (!workerId) throw new Error("Worker ID missing");
        await workerAPI.update(workerId, {
          name: data.name,
          contact: data.contact || undefined,
          email: data.email || undefined,
          address: data.address || undefined,
          status: data.status,
          hireDate: data.hireDate || undefined,
        });
        dialogs.success("Worker updated successfully");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      dialogs.error(err.message || "Failed to save worker");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      safetyClose={true}
      onClose={onClose}
      title={mode === "add" ? "Add Worker" : "Edit Worker"}
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
                <p className="text-xs text-red-500 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Contact */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--sidebar-text)" }}
              >
                Contact
              </label>
              <input
                {...register("contact")}
                className="compact-input w-full border rounded-md"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--border-color)",
                  color: "var(--sidebar-text)",
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--sidebar-text)" }}
              >
                Email
              </label>
              <input
                type="email"
                {...register("email")}
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
            {/* Address */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--sidebar-text)" }}
              >
                Address
              </label>
              <textarea
                {...register("address")}
                rows={2}
                className="compact-input w-full border rounded-md"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--border-color)",
                  color: "var(--sidebar-text)",
                }}
              />
            </div>
            {/* Hire Date */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--sidebar-text)" }}
              >
                Hire Date
              </label>
              <input
                type="date"
                {...register("hireDate")}
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

export default WorkerFormDialog;
