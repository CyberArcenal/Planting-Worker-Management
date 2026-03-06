// src/renderer/pages/assignments/components/AssignmentActionsDropdown.tsx
import React, { useRef, useEffect, useState } from "react";
import {
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import type { Assignment } from "../../../api/core/assignment";

interface AssignmentActionsDropdownProps {
  assignment: Assignment;
  onView: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
  // Optional additional actions
  onEdit?: (assignment: Assignment) => void;
  onMarkCompleted?: (assignment: Assignment) => void;
  onMarkCancelled?: (assignment: Assignment) => void;
  onAddNote?: (assignment: Assignment) => void;
  onViewNote?: (assignment: Assignment) => void;
}

const AssignmentActionsDropdown: React.FC<AssignmentActionsDropdownProps> = ({
  assignment,
  onView,
  onDelete,
  onEdit,
  onMarkCompleted,
  onMarkCancelled,
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

  const hasNote = !!assignment.notes;
  const isActive = assignment.status === "active";

  return (
    <div className="assignment-actions-dropdown-container" ref={dropdownRef}>
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
                handleAction(() => onView(assignment));
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
            >
              <Eye className="w-4 h-4 text-sky-500" />
              <span>View Details</span>
            </button>

            {/* Edit (if provided) */}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onEdit(assignment));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
              >
                <Edit className="w-4 h-4 text-yellow-500" />
                <span>Edit Assignment</span>
              </button>
            )}

            {/* Separator if any of the above actions exist */}
            {(onEdit || onAddNote || onViewNote) && (
              <div className="border-t border-gray-200 my-1" />
            )}

            {/* Note actions */}
            {onAddNote && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onAddNote(assignment));
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
                  handleAction(() => onViewNote(assignment));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
              >
                <FileText className="w-4 h-4 text-blue-500" />
                <span>View Note</span>
              </button>
            )}

            {/* Separator before status changes – only if any status actions might appear */}
            {(isActive && (onMarkCompleted || onMarkCancelled)) && (
              <div className="border-t border-gray-200 my-1" />
            )}

            {/* Status changes – only show if assignment is active and callback provided */}
            {isActive && onMarkCompleted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onMarkCompleted(assignment));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark as Completed</span>
              </button>
            )}

            {isActive && onMarkCancelled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onMarkCancelled(assignment));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Mark as Cancelled</span>
              </button>
            )}

            {/* Separator before delete */}
            <div className="border-t border-gray-200 my-1" />

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(() => onDelete(assignment));
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Assignment</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentActionsDropdown;