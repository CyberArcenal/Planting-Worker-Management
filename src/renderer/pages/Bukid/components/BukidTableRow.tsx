// components/Bukid/components/BukidTableRow.tsx
import React, { useRef, useEffect, useState } from "react";
import {
  Home,
  MapPin,
  ChevronRight,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Calendar,
} from "lucide-react";
import BukidActionsDropdown from "./BukidActionsDropdown";
import { formatDate } from "../../../utils/formatters";
import type { Bukid } from "../../../api/core/bukid";

interface BukidTableRowProps {
  bukid: Bukid;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number, name: string) => void;
  onUpdateStatus: (id: number, currentStatus: string) => void;
  onAddNote: (id: number) => void;
  onViewStats: (id: number) => void;
  onImportCSV: (id: number) => void;
  onExportCSV: (id: number) => void;
  onAddPlot: (id: number) => void;
  onViewPlots: (id: number) => void;
  onViewNote: (id: number) => void;
  onComplete: (id: number) => void;
}

const BukidTableRow: React.FC<BukidTableRowProps> = ({
  bukid,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onView,
  onEdit,
  onDelete,
  onUpdateStatus,
  onAddNote,
  onViewStats,
  onImportCSV,
  onExportCSV,
  onAddPlot,
  onViewPlots,
  onViewNote,
  onComplete,
}) => {
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const getStatusBadge = (status: string = "active") => {
    const statusConfig: Record<string, { bg: string; color: string; icon: any }> = {
      active: { bg: "var(--status-planted-bg)", color: "var(--status-planted)", icon: CheckCircle },
      inactive: { bg: "var(--status-fallow-bg)", color: "var(--status-fallow)", icon: XCircle },
    };
    const config = statusConfig[status] || statusConfig.active;
    const Icon = config.icon;

    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
        style={{
          background: config.bg,
          color: config.color,
        }}
      >
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowActionsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleActionClick = (action: () => void) => {
    action();
    setShowActionsDropdown(false);
  };

  const ExpandedView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium">Timeline</span>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-gray-600">
              <Calendar className="w-3 h-3 inline mr-1" />
              Created: {formatDate(bukid.createdAt, "MMM dd, yyyy")}
            </div>
            <div className="text-xs text-gray-600">
              <Clock className="w-3 h-3 inline mr-1" />
              Updated: {formatDate(bukid.updatedAt, "MMM dd, yyyy HH:mm")}
            </div>
          </div>
        </div>
        {bukid.notes && (
          <div className="p-3 rounded-lg bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Notes</span>
            </div>
            <p className="text-xs text-gray-700">{bukid.notes}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <tr
        className="hover:bg-gray-50 transition-colors border-b border-gray-200 cursor-pointer"
        onClick={onToggleExpand}
      >
        <td className="p-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="rounded border-gray-300"
          />
        </td>
        <td className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ background: "var(--accent-green-light)" }}
            >
              <Home className="w-4 h-4" style={{ color: "var(--accent-green)" }} />
            </div>
            <div>
              <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                {bukid.name}
                {bukid.notes && (
                  <FileText className="w-4 h-4 text-blue-500 inline ml-2" />
                )}
              </div>
            </div>
          </div>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {bukid.location || "No location"}
            </span>
          </div>
        </td>
        <td className="p-4">{getStatusBadge(bukid.status)}</td>
        <td className="p-4">
          <div className="text-sm text-gray-600">
            {formatDate(bukid.createdAt, "MMM dd, yyyy")}
          </div>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onView(bukid.id); }}
              className="p-1.5 rounded hover:bg-gray-100"
              title="View"
            >
              <Eye className="w-4 h-4 text-blue-500" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(bukid.id); }}
              className="p-1.5 rounded hover:bg-gray-100"
              title="Edit"
            >
              <Edit className="w-4 h-4 text-yellow-500" />
            </button>

            <BukidActionsDropdown
              bukid={bukid}
              onComplete={onComplete}
              onAddPlot={onAddPlot}
              onViewPlots={onViewPlots}
              onAddNote={onAddNote}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdateStatus={onUpdateStatus}
              onViewStats={onViewStats}
              onViewNote={onViewNote}
              onImportCSV={onImportCSV}
              onExportCSV={onExportCSV}
            />

            <button
              onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
              className="p-1.5 rounded hover:bg-gray-100"
            >
              <ChevronRight
                className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              />
            </button>
          </div>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={6} className="p-4 bg-gray-50">
            <ExpandedView />
          </td>
        </tr>
      )}
    </>
  );
};

export default BukidTableRow;