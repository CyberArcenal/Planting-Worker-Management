// src/renderer/pages/debt-history/components/DebtHistoryActionsDropdown.tsx
import React, { useRef, useEffect, useState } from "react";
import { Eye, Edit, Trash2, MoreVertical, FileText } from "lucide-react";
import type { DebtHistory } from "../../../api/core/debt_history";

interface DebtHistoryActionsDropdownProps {
  history: DebtHistory;
  onView: (history: DebtHistory) => void;
  onDelete: (history: DebtHistory) => void;
  // Optional additional actions
  onEdit?: (history: DebtHistory) => void;
  onAddNote?: (history: DebtHistory) => void;
  onViewNote?: (history: DebtHistory) => void;
}

const DebtHistoryActionsDropdown: React.FC<DebtHistoryActionsDropdownProps> = ({
  history,
  onView,
  onDelete,
  onEdit,
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
    const dropdownHeight = 250;
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

  const hasNote = !!history.notes;

  return (
    <div className="history-actions-dropdown-container" ref={dropdownRef}>
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
                handleAction(() => onView(history));
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
                  handleAction(() => onEdit(history));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
              >
                <Edit className="w-4 h-4 text-yellow-500" />
                <span>Edit Entry</span>
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
                  handleAction(() => onAddNote(history));
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
                  handleAction(() => onViewNote(history));
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
                handleAction(() => onDelete(history));
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtHistoryActionsDropdown;