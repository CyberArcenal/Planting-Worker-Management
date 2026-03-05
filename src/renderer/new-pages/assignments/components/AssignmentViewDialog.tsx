// src/renderer/pages/assignments/components/AssignmentViewDialog.tsx
import React from "react";
import { ClipboardList, Calendar, FileText, User, MapPin, Layers } from "lucide-react";
import { useAssignmentView } from "../hooks/useAssignmentView";
import Modal from "../../../components/UI/Modal";
import { formatDate } from "../../../utils/formatters";

interface AssignmentViewDialogProps {
  hook: ReturnType<typeof useAssignmentView>;
}

const AssignmentViewDialog: React.FC<AssignmentViewDialogProps> = ({ hook }) => {
  const { isOpen, loading, assignment, close } = hook;

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      active: { bg: "bg-green-100", text: "text-green-700" },
      completed: { bg: "bg-blue-100", text: "text-blue-700" },
      cancelled: { bg: "bg-red-100", text: "text-red-700" },
    };
    const config = statusMap[status] || { bg: "bg-gray-100", text: "text-gray-700" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Assignment Details" size="lg">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-blue)]"></div>
        </div>
      ) : assignment ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[var(--card-secondary-bg)] rounded-md flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-[var(--text-tertiary)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--sidebar-text)]">
                  Assignment #{assignment.id}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Created {formatDate(assignment.createdAt)}
                </p>
              </div>
            </div>
            <div>{getStatusBadge(assignment.status)}</div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left column: Assignment details */}
            <div className="space-y-4">
              <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                  <ClipboardList className="w-4 h-4 mr-1" /> Assignment Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-secondary)] w-28">Luwang Count:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{assignment.luwangCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-secondary)] w-28">Assignment Date:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">
                      {formatDate(assignment.assignmentDate)}
                    </span>
                  </div>
                  {assignment.notes && (
                    <div className="flex gap-2">
                      <span className="text-[var(--text-secondary)] w-28">Notes:</span>
                      <span className="font-medium text-[var(--sidebar-text)]">{assignment.notes}</span>
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
                    <span className="text-[var(--text-secondary)]">Created:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{formatDate(assignment.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Last Updated:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">
                      {assignment.updatedAt ? formatDate(assignment.updatedAt) : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: Related entities */}
            <div className="space-y-4">
              {assignment.worker && (
                <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                    <User className="w-4 h-4 mr-1" /> Worker
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="font-medium text-[var(--sidebar-text)]">{assignment.worker.name}</div>
                    {assignment.worker.contact && (
                      <div className="text-[var(--text-secondary)]">Contact: {assignment.worker.contact}</div>
                    )}
                  </div>
                </div>
              )}

              {assignment.pitak && (
                <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                    <MapPin className="w-4 h-4 mr-1" /> Pitak
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="font-medium text-[var(--sidebar-text)]">{assignment.pitak.location}</div>
                    <div className="text-[var(--text-secondary)]">
                      Bukid: {assignment.pitak.bukid?.name || "-"}
                    </div>
                    <div className="text-[var(--text-secondary)]">
                      Total Luwang: {assignment.pitak.totalLuwang}
                    </div>
                  </div>
                </div>
              )}

              {assignment.session && (
                <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                    <Layers className="w-4 h-4 mr-1" /> Session
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="font-medium text-[var(--sidebar-text)]">{assignment.session.name}</div>
                    <div className="text-[var(--text-secondary)]">Year: {assignment.session.year}</div>
                    <div className="text-[var(--text-secondary)]">Status: {assignment.session.status}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center py-4 text-[var(--text-secondary)]">Assignment not found.</p>
      )}
    </Modal>
  );
};

export default AssignmentViewDialog;