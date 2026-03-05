// src/renderer/pages/sessions/components/SessionViewDialog.tsx
import React from "react";
import { Calendar, FileText, Layers, MapPin } from "lucide-react";
import { useSessionView } from "../hooks/useSessionView";
import { formatDate } from "../../../utils/formatters";
import Modal from "../../../components/UI/Modal";
interface SessionViewDialogProps {
  hook: ReturnType<typeof useSessionView>;
}

const SessionViewDialog: React.FC<SessionViewDialogProps> = ({ hook }) => {
  const { isOpen, loading, session, close } = hook;

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      active: { bg: "bg-green-100", text: "text-green-700" },
      closed: { bg: "bg-gray-100", text: "text-gray-700" },
      archived: { bg: "bg-purple-100", text: "text-purple-700" },
    };
    const config = statusMap[status] || { bg: "bg-gray-100", text: "text-gray-700" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getSeasonTypeDisplay = (type?: string | null) => {
    if (!type) return "-";
    const map: Record<string, string> = {
      "tag-ulan": "Tag-ulan",
      "tag-araw": "Tag-araw",
      custom: "Custom",
    };
    return map[type] || type;
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Session Details" size="lg">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-blue)]"></div>
        </div>
      ) : session ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[var(--card-secondary-bg)] rounded-md flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[var(--text-tertiary)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--sidebar-text)]">{session.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  ID: {session.id} • Created {formatDate(session.createdAt)}
                </p>
              </div>
            </div>
            <div>{getStatusBadge(session.status)}</div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left column: Session info */}
            <div className="space-y-4">
              <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                  <Calendar className="w-4 h-4 mr-1" /> Session Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-secondary)] w-24">Name:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{session.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-secondary)] w-24">Season:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">
                      {getSeasonTypeDisplay(session.seasonType)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-secondary)] w-24">Year:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{session.year}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-secondary)] w-24">Start Date:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">
                      {session.startDate ? formatDate(session.startDate) : "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-secondary)] w-24">End Date:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">
                      {session.endDate ? formatDate(session.endDate) : "-"}
                    </span>
                  </div>
                  {session.notes && (
                    <div className="flex gap-2">
                      <span className="text-[var(--text-secondary)] w-24">Notes:</span>
                      <span className="font-medium text-[var(--sidebar-text)]">{session.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column: Related entities & Timeline */}
            <div className="space-y-4">
              <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                  <Layers className="w-4 h-4 mr-1" /> Related Records
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-[var(--text-secondary)]">Bukids:</span>
                    <div className="font-medium text-[var(--sidebar-text)]">
                      {session.bukids?.length || 0}
                    </div>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)]">Assignments:</span>
                    <div className="font-medium text-[var(--sidebar-text)]">
                      {session.assignments?.length || 0}
                    </div>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)]">Payments:</span>
                    <div className="font-medium text-[var(--sidebar-text)]">
                      {session.payments?.length || 0}
                    </div>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)]">Debts:</span>
                    <div className="font-medium text-[var(--sidebar-text)]">
                      {session.debts?.length || 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                  <FileText className="w-4 h-4 mr-1" /> Timeline
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Created:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{formatDate(session.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Last Updated:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">
                      {session.updatedAt ? formatDate(session.updatedAt) : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center py-4 text-[var(--text-secondary)]">Session not found.</p>
      )}
    </Modal>
  );
};

export default SessionViewDialog;