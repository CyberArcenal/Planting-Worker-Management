// src/renderer/pages/notifications/components/NotificationViewDialog.tsx
import React, { useState } from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";
import {
  Bell,
  User,
  Calendar,
  FileText,
  Info,
  X,
  CheckCircle,
  AlertTriangle,
  ShoppingCart,
  Package,
} from "lucide-react";
import { formatDate } from "../../../utils/formatters";
import notificationAPI, {
  type Notification,
} from "../../../api/core/notifications";
interface NotificationViewDialogProps {
  isOpen: boolean;
  notification: Notification | null;
  loading: boolean;
  onClose: () => void;
  onMarkAsRead?: (id: number) => void;
}

const NotificationViewDialog: React.FC<NotificationViewDialogProps> = ({
  isOpen,
  notification,
  loading,
  onClose,
  onMarkAsRead,
}) => {
  const [activeTab, setActiveTab] = useState<"details" | "metadata">("details");

  if (!notification && !loading) return null;

  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      info: Info,
      success: CheckCircle,
      warning: AlertTriangle,
      error: AlertTriangle,
      purchase: Package,
      sale: ShoppingCart,
    };
    return iconMap[type] || Bell;
  };

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, { bg: string; text: string; icon: string }> =
      {
        info: {
          bg: "bg-blue-100",
          text: "text-blue-700",
          icon: "text-blue-500",
        },
        success: {
          bg: "bg-green-100",
          text: "text-green-700",
          icon: "text-green-500",
        },
        warning: {
          bg: "bg-yellow-100",
          text: "text-yellow-700",
          icon: "text-yellow-500",
        },
        error: { bg: "bg-red-100", text: "text-red-700", icon: "text-red-500" },
        purchase: {
          bg: "bg-purple-100",
          text: "text-purple-700",
          icon: "text-purple-500",
        },
        sale: {
          bg: "bg-emerald-100",
          text: "text-emerald-700",
          icon: "text-emerald-500",
        },
      };
    return (
      colorMap[type] || {
        bg: "bg-gray-100",
        text: "text-gray-700",
        icon: "text-gray-500",
      }
    );
  };

  const TypeIcon = notification ? getTypeIcon(notification.type) : Bell;
  const typeStyle = notification ? getTypeColor(notification.type) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notification Details"
      size="lg"
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-blue)]"></div>
        </div>
      ) : notification ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-md flex items-center justify-center ${typeStyle?.bg}`}
              >
                <TypeIcon className={`w-6 h-6 ${typeStyle?.icon}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--sidebar-text)]">
                  {notification.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {formatDate(notification.createdAt, "MMM dd, yyyy HH:mm")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  notification.isRead
                    ? "bg-gray-100 text-gray-700"
                    : "bg-[var(--accent-blue)] text-white"
                }`}
              >
                {notification.isRead ? "Read" : "Unread"}
              </span>
              {!notification.isRead && onMarkAsRead && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <CheckCircle className="w-4 h-4 mr-1" /> Mark as Read
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-[var(--border-color)]">
            <nav className="flex gap-4">
              {(["details", "metadata"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? "border-[var(--accent-blue)] text-[var(--accent-blue)]"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--sidebar-text)]"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="mt-4">
            {activeTab === "details" && (
              <div className="space-y-4">
                {/* Message */}
                <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                    <FileText className="w-4 h-4 mr-1" /> Message
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">
                    {notification.message}
                  </p>
                </div>

                {/* Basic info */}
                <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                    <Info className="w-4 h-4 mr-1" /> Information
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-[var(--text-secondary)]">ID:</span>{" "}
                      {notification.id}
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)]">
                        Type:
                      </span>{" "}
                      {notification.type}
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)]">
                        User ID:
                      </span>{" "}
                      {notification.userId || "System"}
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)]">
                        Read:
                      </span>{" "}
                      {notification.isRead ? "Yes" : "No"}
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)]">
                        Created:
                      </span>{" "}
                      {formatDate(notification.createdAt)}
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)]">
                        Updated:
                      </span>{" "}
                      {notification.updatedAt
                        ? formatDate(notification.updatedAt)
                        : "-"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "metadata" && (
              <div>
                <h4 className="font-medium mb-2 text-[var(--sidebar-text)]">
                  Metadata
                </h4>
                {!notification.metadata ? (
                  <p className="text-center py-4 text-[var(--text-secondary)]">
                    No metadata available.
                  </p>
                ) : (
                  <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                    <pre className="text-xs bg-[var(--card-bg)] p-2 rounded max-h-96 overflow-auto">
                      {JSON.stringify(notification.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-center py-4 text-[var(--text-secondary)]">
          Notification not found.
        </p>
      )}
    </Modal>
  );
};

export default NotificationViewDialog;
