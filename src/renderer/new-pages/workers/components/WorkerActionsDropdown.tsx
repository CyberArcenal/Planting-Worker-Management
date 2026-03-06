// src/renderer/pages/workers/components/WorkerActionsDropdown.tsx
import React, { useRef, useEffect, useState } from "react";
import {
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  XCircle,
  UserMinus,
  UserX,
} from "lucide-react";
import type { Worker } from "../../../api/core/worker";

interface WorkerActionsDropdownProps {
  worker: Worker;
  onView: (worker: Worker) => void;
  onEdit: (worker: Worker) => void;
  onDelete: (worker: Worker) => void;
  // Optional status change actions
  onMarkActive?: (worker: Worker) => void;
  onMarkInactive?: (worker: Worker) => void;
  onMarkOnLeave?: (worker: Worker) => void;
  onMarkTerminated?: (worker: Worker) => void;
}

const WorkerActionsDropdown: React.FC<WorkerActionsDropdownProps> = ({
  worker,
  onView,
  onEdit,
  onDelete,
  onMarkActive,
  onMarkInactive,
  onMarkOnLeave,
  onMarkTerminated,
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
    const dropdownHeight = 300;
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

  const status = worker.status;

  // Determine which status change actions are allowed from current status
  const canMarkActive = (status === "inactive" || status === "on-leave") && onMarkActive;
  const canMarkInactive = status === "active" && onMarkInactive;
  const canMarkOnLeave = status === "active" && onMarkOnLeave;
  const canMarkTerminated =
    (status === "active" || status === "inactive" || status === "on-leave") && onMarkTerminated;

  const hasAnyStatusAction = canMarkActive || canMarkInactive || canMarkOnLeave || canMarkTerminated;

  return (
    <div className="worker-actions-dropdown-container" ref={dropdownRef}>
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
                handleAction(() => onView(worker));
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
            >
              <Eye className="w-4 h-4 text-sky-500" />
              <span>View Details</span>
            </button>

            {/* Edit Worker */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(() => onEdit(worker));
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
            >
              <Edit className="w-4 h-4 text-yellow-500" />
              <span>Edit Worker</span>
            </button>

            {/* Separator if any status actions exist */}
            {hasAnyStatusAction && <div className="border-t border-gray-200 my-1" />}

            {/* Status changes - shown conditionally based on allowed transitions */}
            {canMarkActive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onMarkActive(worker));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark as Active</span>
              </button>
            )}

            {canMarkInactive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onMarkInactive(worker));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Mark as Inactive</span>
              </button>
            )}

            {canMarkOnLeave && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onMarkOnLeave(worker));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
              >
                <UserMinus className="w-4 h-4" />
                <span>Mark as On Leave</span>
              </button>
            )}

            {canMarkTerminated && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onMarkTerminated(worker));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <UserX className="w-4 h-4" />
                <span>Mark as Terminated</span>
              </button>
            )}

            {/* Separator before delete */}
            <div className="border-t border-gray-200 my-1" />

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(() => onDelete(worker));
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Worker</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerActionsDropdown;