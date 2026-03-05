import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { dialogs } from "../../utils/dialogs";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  minHeight?: string;
  showCloseButton?: boolean;
  closeOnClickOutside?: boolean;
  closeOnEsc?: boolean;
  preventScroll?: boolean;
  blur?: boolean;
  safetyClose?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  minHeight = "200px",
  showCloseButton = true,
  closeOnClickOutside = true,
  closeOnEsc = true,
  preventScroll = true,
  blur = false,
  safetyClose = false,
}) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const handleClose = async () => {
    if (
      safetyClose &&
      !(await dialogs.confirm({
        title: "Close",
        message: "Are you sure you want to close this dialog?",
      }))
    )
      return;
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      onClose();
    }, 200);
  };

  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, closeOnEsc]);

  useEffect(() => {
    if (isOpen) {
      const previouslyFocused = document.activeElement as HTMLElement;
      const modalElement = document.getElementById("modal-container");
      modalElement?.focus();
      return () => previouslyFocused?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (preventScroll) {
      document.body.style.overflow = isOpen ? "hidden" : "unset";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, preventScroll]);

  if (!isOpen && !isAnimatingOut) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-200 ${
          isAnimatingOut ? "opacity-0" : "opacity-100"
        } ${blur ? "backdrop-blur-sm" : ""}`}
        onClick={closeOnClickOutside ? handleClose : undefined}
      />

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          id="modal-container"
          tabIndex={-1}
          className={`relative w-full ${sizeClasses[size]} 
            rounded-md bg-[var(--card-bg)] shadow-lg border border-[var(--border-color)] 
            transition-opacity duration-200 ${
              isAnimatingOut ? "opacity-0" : "opacity-100"
            }`}
          style={{ backgroundColor: "var(--card-bg)", minHeight: minHeight }}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)] bg-[var(--card-secondary-bg)]">
              {title && (
                <h3
                  id="modal-title"
                  className="text-base font-semibold text-[var(--sidebar-text)]"
                >
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  onClick={handleClose}
                  className="rounded-sm p-1 hover:bg-[var(--card-secondary-bg)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
                  aria-label="Close modal"
                >
                  <X
                    className="h-4 w-4"
                    style={{ color: "var(--text-secondary)" }}
                  />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="px-4 py-3 text-[var(--sidebar-text)]">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex justify-end gap-2 px-4 py-2 border-t border-[var(--border-color)] bg-[var(--card-secondary-bg)]">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;