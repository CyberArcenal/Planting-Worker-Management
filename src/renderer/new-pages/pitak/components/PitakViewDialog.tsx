// src/renderer/pages/pitak/components/PitakViewDialog.tsx
import React from "react";
import { MapPin, Calendar, FileText, Edit } from "lucide-react";
import { usePitakView } from "../hooks/usePitakView";
import Modal from "../../../components/UI/Modal";
import { formatDate } from "../../../utils/formatters";

// Traditional measurement constants
const BUHOL_TO_METERS = 50;

interface PitakViewDialogProps {
  hook: ReturnType<typeof usePitakView>;
}

const PitakViewDialog: React.FC<PitakViewDialogProps> = ({ hook }) => {
  const { isOpen, loading, pitak, close } = hook;

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      active: { bg: "bg-green-100", text: "text-green-700" },
      inactive: { bg: "bg-gray-100", text: "text-gray-700" },
      archived: { bg: "bg-purple-100", text: "text-purple-700" },
    };
    const config = statusMap[status] || { bg: "bg-gray-100", text: "text-gray-700" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Parse sideLengths if it exists
  const parseSideLengths = () => {
    if (!pitak?.sideLengths) return null;
    try {
      return typeof pitak.sideLengths === "string"
        ? JSON.parse(pitak.sideLengths)
        : pitak.sideLengths;
    } catch (e) {
      console.error("Failed to parse sideLengths:", e);
      return null;
    }
  };

  const renderDimensions = () => {
    if (!pitak?.layoutType) return null;

    const parsed = parseSideLengths();
    const inputs = parsed?.buholInputs || {};
    const method = parsed?.measurementMethod || "";
    const triangleMode = parsed?.triangleMode;

    // Helper to format a dimension with buhol and meters
    const formatDimension = (label: string, buhol: number) => {
      if (buhol === undefined) return null;
      const meters = buhol * BUHOL_TO_METERS;
      return (
        <div className="flex items-center justify-between text-sm border-b border-gray-100 pb-1">
          <span className="text-gray-600">{label}:</span>
          <span className="font-medium text-gray-900">
            {buhol.toFixed(2)} buhol ({meters.toFixed(2)} m)
          </span>
        </div>
      );
    };

    // Layout-specific rendering
    switch (pitak.layoutType) {
      case "square":
        return (
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Square Dimensions</h5>
            {formatDimension("Side", inputs.side)}
          </div>
        );

      case "rectangle":
        return (
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Rectangle Dimensions</h5>
            {formatDimension("Length", inputs.length)}
            {formatDimension("Width", inputs.width)}
          </div>
        );

      case "triangle":
        return (
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Triangle Dimensions</h5>
            {triangleMode === "base_height" ? (
              <>
                {formatDimension("Base", inputs.base)}
                {formatDimension("Height", inputs.height)}
              </>
            ) : (
              <>
                {formatDimension("Side A", inputs.sideA)}
                {formatDimension("Side B", inputs.sideB)}
                {formatDimension("Side C", inputs.sideC)}
              </>
            )}
          </div>
        );

      case "circle":
        return (
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Circle Dimensions</h5>
            {formatDimension("Radius", inputs.radius)}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Pitak Details" size="lg">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-blue)]"></div>
        </div>
      ) : pitak ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[var(--card-secondary-bg)] rounded-md flex items-center justify-center">
                <MapPin className="w-6 h-6 text-[var(--text-tertiary)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--sidebar-text)]">{pitak.location}</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  ID: {pitak.id} • Created {formatDate(pitak.createdAt)}
                </p>
              </div>
            </div>
            <div>{getStatusBadge(pitak.status)}</div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left column: Basic info */}
            <div className="space-y-4">
              <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                  <MapPin className="w-4 h-4 mr-1" /> Pitak Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-secondary)] w-28">Location:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{pitak.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-secondary)] w-28">Bukid:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{pitak.bukid?.name || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-secondary)] w-28">Total Luwang:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{pitak.totalLuwang}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-secondary)] w-28">Area (sqm):</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{pitak.areaSqm}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-secondary)] w-28">Layout Type:</span>
                    <span className="font-medium text-[var(--sidebar-text)] capitalize">{pitak.layoutType || "-"}</span>
                  </div>

                  {/* Dimensions Section */}
                  {pitak.layoutType && renderDimensions()}

                  {pitak.notes && (
                    <div className="flex gap-2 pt-2">
                      <span className="text-[var(--text-secondary)] w-28">Notes:</span>
                      <span className="font-medium text-[var(--sidebar-text)] whitespace-pre-wrap">{pitak.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column: Timeline & Stats */}
            <div className="space-y-4">
              <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                  <Calendar className="w-4 h-4 mr-1" /> Timeline
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Created:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">{formatDate(pitak.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Last Updated:</span>
                    <span className="font-medium text-[var(--sidebar-text)]">
                      {pitak.updatedAt ? formatDate(pitak.updatedAt) : "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
                <h4 className="font-medium mb-2 flex items-center text-[var(--sidebar-text)]">
                  <FileText className="w-4 h-4 mr-1" /> Summary
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-[var(--text-secondary)]">Assignments:</span>
                    <div className="font-medium text-[var(--sidebar-text)]">
                      {pitak.assignments?.length || 0}
                    </div>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)]">Payments:</span>
                    <div className="font-medium text-[var(--sidebar-text)]">
                      {pitak.payments?.length || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center py-4 text-[var(--text-secondary)]">Pitak not found.</p>
      )}
    </Modal>
  );
};

export default PitakViewDialog;