// src/renderer/pages/sessions/components/SessionActionsDropdown.tsx
import React, { useRef, useEffect, useState } from "react";
import {
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  XCircle,
  Archive,
  FileText,
} from "lucide-react";
import type { Session } from "../../../api/core/session";

interface SessionActionsDropdownProps {
  session: Session;
  onView: (session: Session) => void;
  onEdit: (session: Session) => void;
  onDelete: (session: Session) => void;
  // Optional additional actions
  onMarkActive?: (session: Session) => void;
  onMarkClosed?: (session: Session) => void;
  onMarkArchived?: (session: Session) => void;
  onAddNote?: (session: Session) => void;
  onViewNote?: (session: Session) => void;
}

const SessionActionsDropdown: React.FC<SessionActionsDropdownProps> = ({
  session,
  onView,
  onEdit,
  onDelete,
  onMarkActive,
  onMarkClosed,
  onMarkArchived,
  onAddNote,
  onViewNote,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => setIsOpen(!isOpen);
  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDropdownPosition = () => {
    if (!buttonRef.current) return {};
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 350;
    const windowHeight = window.innerHeight;

    if (rect.bottom + dropdownHeight > windowHeight) {
      return {
        bottom: `${windowHeight - rect.top + 5}px`,
        right: `${window.innerWidth - rect.right}px`,
      };
    }
    return {
      top: `${rect.bottom + 5}px`,
      right: `${window.innerWidth - rect.right}px`,
    };
  };

  const status = session.status;
  const hasNote = !!session.notes;

  // Allowed transitions based on SessionService
  const canMarkActive = (status === "closed" || status === "archived") && onMarkActive;
  const canMarkClosed = status === "active" && onMarkClosed;
  const canMarkArchived = (status === "active" || status === "closed") && onMarkArchived;

  return (
    <div className="session-actions-dropdown-container" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors relative cursor-pointer"
        title="More Actions"
      >
        <MoreVertical
          className="w-4 h-4"
          style={{ color: "var(--text-secondary)" }}
        />
      </button>

      {isOpen && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 w-56 z-50 max-h-96 overflow-y-auto"
          style={getDropdownPosition()}
        >
          <div className="py-1">
            {/* View Details */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(() => onView(session));
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
            >
              <Eye className="w-4 h-4 text-sky-500" />
              <span>View Details</span>
            </button>

            {/* Edit Session */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(() => onEdit(session));
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
            >
              <Edit className="w-4 h-4 text-yellow-500" />
              <span>Edit Session</span>
            </button>

            {/* Separator if any status/note actions exist */}
            {(onAddNote || onViewNote || canMarkActive || canMarkClosed || canMarkArchived) && (
              <div className="border-t border-gray-200 my-1" />
            )}

            {/* Status changes – only show if allowed from current status */}
            {canMarkActive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onMarkActive(session));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark as Active</span>
              </button>
            )}

            {canMarkClosed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onMarkClosed(session));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Mark as Closed</span>
              </button>
            )}

            {canMarkArchived && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onMarkArchived(session));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                <Archive className="w-4 h-4" />
                <span>Mark as Archived</span>
              </button>
            )}

            {/* Note actions */}
            {onAddNote && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onAddNote(session));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
              >
                <FileText className="w-4 h-4 text-green-500" />
                <span>Add / Edit Note</span>
              </button>
            )}

            {hasNote && onViewNote && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onViewNote(session));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
              >
                <FileText className="w-4 h-4 text-blue-500" />
                <span>View Note</span>
              </button>
            )}

            {/* Separator before delete */}
            <div className="border-t border-gray-200 my-1" />

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(() => onDelete(session));
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Session</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionActionsDropdown;