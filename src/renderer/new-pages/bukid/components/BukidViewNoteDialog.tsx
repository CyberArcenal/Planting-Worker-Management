// src/renderer/pages/bukid/components/BukidViewNoteDialog.tsx
import React from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";
import { User } from "lucide-react";

interface BukidViewNoteDialogProps {
  isOpen: boolean;
  bukid: { name: string; notes?: string | null } | null;
  onClose: () => void;
}

const BukidViewNoteDialog: React.FC<BukidViewNoteDialogProps> = ({
  isOpen,
  bukid,
  onClose,
}) => {
  if (!bukid) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Note from ${bukid.name}`} size="md">
      <div className="p-4">
        {/* Header with avatar */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{bukid.name}</h3>
            <p className="text-xs text-gray-500">Just now</p>
          </div>
        </div>

        {/* Chat bubble */}
        <div className="flex justify-start mb-4">
          <div className="relative max-w-[80%] bg-blue-500 text-white rounded-2xl rounded-tl-none px-4 py-3 shadow">
            {/* Bubble tail (left side) */}
            <div
              className="absolute -left-2 top-0 w-4 h-4 bg-blue-500"
              style={{
                clipPath: "polygon(0 0, 100% 0, 0 100%)",
              }}
            ></div>
            <p className="text-sm whitespace-pre-wrap">
              {bukid.notes || "No notes available."}
            </p>
          </div>
        </div>

        {/* Optional: reply area (just for design) */}
        <div className="mt-4 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

export default BukidViewNoteDialog;