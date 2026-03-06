// src/renderer/pages/pitak/components/PitakActionsDropdown.tsx
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
  BookCopy,
  X,
} from "lucide-react";
import type { Pitak } from "../../../api/core/pitak";

interface PitakActionsDropdownProps {
  pitak: Pitak;
  onView: (pitak: Pitak) => void;
  onEdit: (pitak: Pitak) => void;
  onDelete: (pitak: Pitak) => void;
  // Optional additional actions
  onMarkCancelled?: (pitak: Pitak) => void;
  onAssignWorker?: (pitak: Pitak) => void;
  onMarkComplete?: (pitak: Pitak) => void;
  onAddNote?: (pitak: Pitak) => void; // for adding/editing note
  onViewNote?: (pitak: Pitak) => void; // for viewing existing note
}

const PitakActionsDropdown: React.FC<PitakActionsDropdownProps> = ({
  pitak,
  onView,
  onEdit,
  onDelete,
  onAssignWorker,
  onMarkCancelled,
  onMarkComplete,
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
    const dropdownHeight = 350; // approximate max height
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

  const hasNote = !!pitak.notes;

  return (
    <div className="pitak-actions-dropdown-container" ref={dropdownRef}>
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
                handleAction(() => onView(pitak));
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
            >
              <Eye className="w-4 h-4 text-sky-500" />
              <span>View Details</span>
            </button>

            {/* Edit Pitak */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(() => onEdit(pitak));
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
            >
              <Edit className="w-4 h-4 text-yellow-500" />
              <span>Edit Pitak</span>
            </button>

            {/* Separator if any status/note actions exist */}
            {(onMarkCancelled ||
              onMarkComplete ||
              onAddNote ||
              onViewNote) && <div className="border-t border-gray-200 my-1" />}

            {onAssignWorker && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onAssignWorker(pitak));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50"
              >
                <BookCopy className="w-4 h-4" />
                <span>Assign Workers</span>
              </button>
            )}

            {/* Status changes */}
            {onMarkCancelled && pitak.status === "active" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onMarkCancelled(pitak));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
                <span>Mark as Cancelled</span>
              </button>
            )}

            {onMarkComplete && pitak.status === "active" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onMarkComplete?.(pitak));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark as Completed</span>
              </button>
            )}

            {/* Note actions */}
            {onAddNote && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onAddNote(pitak));
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
                  handleAction(() => onViewNote(pitak));
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
                handleAction(() => onDelete(pitak));
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Pitak</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PitakActionsDropdown;
