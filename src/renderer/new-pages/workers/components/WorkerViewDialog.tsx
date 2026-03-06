// src/renderer/pages/workers/components/WorkerViewDialog.tsx
import React from "react";
import { Users, Calendar, Mail, Phone, MapPin, Briefcase } from "lucide-react";
import { useWorkerView } from "../hooks/useWorkerView";
import Modal from "../../../components/UI/Modal";
import { formatDate } from "../../../utils/formatters";

interface WorkerViewDialogProps {
  hook: ReturnType<typeof useWorkerView>;
}

const WorkerViewDialog: React.FC<WorkerViewDialogProps> = ({ hook }) => {
  const { isOpen, loading, worker, close } = hook;

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      active: { bg: "bg-green-100", text: "text-green-700" },
      inactive: { bg: "bg-gray-100", text: "text-gray-700" },
      "on-leave": { bg: "bg-yellow-100", text: "text-yellow-700" },
      terminated: { bg: "bg-red-100", text: "text-red-700" },
    };
    const config = statusMap[status] || { bg: "bg-gray-100", text: "text-gray-700" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {status === "on-leave" ? "On Leave" : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Worker Details" size="lg">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-blue)]"></div>
        </div>
      ) : worker ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[var(--card-secondary-bg)] rounded-md flex items-center justify-center">
                <Users className="w-6 h-6 text-[var(--text-tertiary)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--sidebar-text)]">{worker.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  ID: {worker.id} • Created {formatDate(worker.createdAt)}
                </p>
              </div>
            </div>
            <div>{getStatusBadge(worker.status)}</div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left column: Personal info */}
            <div className="space-y-4">
              <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                  <Users className="w-4 h-4 mr-1" /> Personal Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-secondary)] w-24">Name:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{worker.name}</span>
                  </div>
                  {worker.contact && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[var(--text-secondary)]" />
                      <span className="font-medium text-[var(--sidebar-text)]">{worker.contact}</span>
                    </div>
                  )}
                  {worker.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[var(--text-secondary)]" />
                      <span className="font-medium text-[var(--sidebar-text)]">{worker.email}</span>
                    </div>
                  )}
                  {worker.address && (
                    <div className="flex gap-2">
                      <MapPin className="w-4 h-4 text-[var(--text-secondary)]" />
                      <span className="font-medium text-[var(--sidebar-text)]">{worker.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                  <Calendar className="w-4 h-4 mr-1" /> Timeline
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Hire Date:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">
                      {worker.hireDate ? formatDate(worker.hireDate) : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Created:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{formatDate(worker.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Last Updated:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">
                      {worker.updatedAt ? formatDate(worker.updatedAt) : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: Work summary */}
            <div className="space-y-4">
              <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                  <Briefcase className="w-4 h-4 mr-1" /> Work Summary
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-[var(--text-secondary)]">Assignments:</span>
                    <div className="font-medium text-[var(--sidebar-text)]">
                      {worker.assignments?.length || 0}
                    </div>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)]">Payments:</span>
                    <div className="font-medium text-[var(--sidebar-text)]">
                      {worker.payments?.length || 0}
                    </div>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)]">Debts:</span>
                    <div className="font-medium text-[var(--sidebar-text)]">
                      {worker.debts?.length || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center py-4 text-[var(--text-secondary)]">Worker not found.</p>
      )}
    </Modal>
  );
};

export default WorkerViewDialog;