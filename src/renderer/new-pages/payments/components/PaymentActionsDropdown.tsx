// src/renderer/pages/payments/components/PaymentActionsDropdown.tsx
import React, { useRef, useEffect, useState } from "react";
import {
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  XCircle,
  FileText,
  Mail,
} from "lucide-react";
import type { Payment } from "../../../api/core/payment";

interface PaymentActionsDropdownProps {
  payment: Payment;
  onView: (payment: Payment) => void;
  onDelete: (payment: Payment) => void;
  // Optional additional actions
  onEdit?: (payment: Payment) => void;
  onMarkComplete?: (payment: Payment) => void;
  onMarkCancelled?: (payment: Payment) => void;
  onAddNote?: (payment: Payment) => void;
  onViewNote?: (payment: Payment) => void;
  onSendReceipt?: (payment: Payment) => void;
}

const PaymentActionsDropdown: React.FC<PaymentActionsDropdownProps> = ({
  payment,
  onView,
  onDelete,
  onEdit,
  onMarkComplete,
  onMarkCancelled,
  onAddNote,
  onViewNote,
  onSendReceipt,
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

  const status = payment.status;
  const hasNote = !!payment.notes;

  // Allowed transitions based on PaymentService
  const canMarkComplete = (status === "pending" || status === "partially_paid") && onMarkComplete;
  const canMarkCancelled = (status === "pending" || status === "partially_paid") && onMarkCancelled;

  return (
    <div className="payment-actions-dropdown-container" ref={dropdownRef}>
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
                handleAction(() => onView(payment));
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
                  handleAction(() => onEdit(payment));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
              >
                <Edit className="w-4 h-4 text-yellow-500" />
                <span>Edit Payment</span>
              </button>
            )}

            {/* Separator if any of the above actions exist */}
            {(onEdit || onAddNote || onViewNote || onSendReceipt || canMarkComplete || canMarkCancelled) && (
              <div className="border-t border-gray-200 my-1" />
            )}

            {/* Status changes – only show if allowed from current status */}
            {canMarkComplete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onMarkComplete(payment));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark as Complete</span>
              </button>
            )}

            {canMarkCancelled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onMarkCancelled(payment));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Mark as Cancelled</span>
              </button>
            )}

            {/* Note actions */}
            {onAddNote && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onAddNote(payment));
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
                  handleAction(() => onViewNote(payment));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
              >
                <FileText className="w-4 h-4 text-blue-500" />
                <span>View Note</span>
              </button>
            )}

            {/* Send Receipt (if provided) */}
            {onSendReceipt && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(() => onSendReceipt(payment));
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50"
              >
                <Mail className="w-4 h-4" />
                <span>Send Receipt</span>
              </button>
            )}

            {/* Separator before delete */}
            <div className="border-t border-gray-200 my-1" />

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(() => onDelete(payment));
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Payment</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentActionsDropdown;