// src/renderer/pages/bukid/components/BukidActionsDropdown.tsx
import React, { useRef, useEffect, useState } from "react";
import {
  Eye,
  Edit,
  Map,
  Trash2,
  MoreVertical,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { Bukid } from "../../../api/core/bukid";

interface BukidActionsDropdownProps {
  bukid: Bukid;
  onView: (bukid: Bukid) => void;
  onEdit: (bukid: Bukid) => void;
  onDelete: (bukid: Bukid) => void;
  onAddPlot?: (bukid: Bukid) => void;
  onAddNote?: (bukid: Bukid) => void;      // for editing/adding note
  onViewNote?: (bukid: Bukid) => void;      // for viewing note
  onMarkComplete?: (bukid: Bukid) => void;
  onMarkCancelled?: (bukid: Bukid) => void;
}

const BukidActionsDropdown: React.FC<BukidActionsDropdownProps> = ({
  bukid,
  onView,
  onEdit,
  onDelete,
  onAddPlot,
  onAddNote,
  onViewNote,
  onMarkComplete,
  onMarkCancelled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleAction = (action: () => void, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const isActive = bukid.status === "active";
  const isInitiated = bukid.status === "initiated";
  const canComplete = isActive || isInitiated;
  const canCancel = isActive || isInitiated;

  return (
    <div className="bukid-actions-dropdown-container" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
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
            <button
              onClick={(e) => handleAction(() => onView(bukid), e)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
            >
              <Eye className="w-4 h-4 text-sky-500" />
              <span>View Details</span>
            </button>

            <button
              onClick={(e) => handleAction(() => onEdit(bukid), e)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
            >
              <Edit className="w-4 h-4 text-yellow-500" />
              <span>Edit Bukid</span>
            </button>

            {onAddPlot && (
              <button
                onClick={(e) => handleAction(() => onAddPlot(bukid), e)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
              >
                <Map className="w-4 h-4 text-purple-500" />
                <span>Add Plot</span>
              </button>
            )}

            {/* View Note – ipapakita lang kung may notes */}
            {bukid.notes && onViewNote && (
              <button
                onClick={(e) => handleAction(() => onViewNote(bukid), e)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
              >
                <FileText className="w-4 h-4 text-blue-500" />
                <span>View Note</span>
              </button>
            )}

            {onAddNote && (
              <button
                onClick={(e) => handleAction(() => onAddNote(bukid), e)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
              >
                <FileText className="w-4 h-4 text-green-500" />
                <span>Add / Edit Note</span>
              </button>
            )}

            <div className="border-t border-gray-200 my-1"></div>

            {canComplete && onMarkComplete && (
              <button
                onClick={(e) => handleAction(() => onMarkComplete(bukid), e)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark as Complete</span>
              </button>
            )}

            {canCancel && onMarkCancelled && (
              <button
                onClick={(e) => handleAction(() => onMarkCancelled(bukid), e)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Mark as Cancelled</span>
              </button>
            )}

            <div className="border-t border-gray-200 my-1"></div>
            <button
              onClick={(e) => handleAction(() => onDelete(bukid), e)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Bukid</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BukidActionsDropdown;