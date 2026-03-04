// components/Pitak/components/PitakGridView.tsx
import React from "react";
import {
  MapPin,
  Home,
  Eye,
  Edit,
  User,
} from "lucide-react";
import { getStatusBadge } from "../expanded/utils/statusUtils";
import { formatDate } from "../../../utils/formatters";
import type { Pitak } from "../../../api/core/pitak";

interface PitakGridViewProps {
  pitaks: Pitak[];
  selectedPitaks: number[];
  toggleSelectPitak: (id: number) => void;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onAssign: (id: number) => void;
}

const PitakGridView: React.FC<PitakGridViewProps> = ({
  pitaks,
  selectedPitaks,
  toggleSelectPitak,
  onView,
  onEdit,
  onAssign,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {pitaks.map((pitak) => (
        <div
          key={pitak.id}
          className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg relative bg-white border border-gray-200"
        >
          <div className="absolute top-3 right-3">
            <input
              type="checkbox"
              checked={selectedPitaks.includes(pitak.id)}
              onChange={() => toggleSelectPitak(pitak.id)}
              className="rounded border-gray-300"
            />
          </div>
          <div className="flex items-start gap-3 mb-4">
            <div className="p-3 rounded-lg bg-green-50">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1 text-gray-900">
                {pitak.location || "No location"}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <Home className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {pitak.bukid?.name || `Bukid #${pitak.bukid?.id}`}
                </span>
              </div>
              {getStatusBadge(pitak.status)}
            </div>
          </div>
          <div className="mb-4 p-3 rounded bg-gray-50">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Luwang:</span>
              <span className="font-medium text-gray-900">{pitak.totalLuwang}</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Created {formatDate(pitak.createdAt, "MMM dd, yyyy")}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => onView(pitak.id)} className="p-1.5 rounded hover:bg-gray-100" title="View">
                <Eye className="w-4 h-4 text-blue-500" />
              </button>
              <button onClick={() => onEdit(pitak.id)} className="p-1.5 rounded hover:bg-gray-100" title="Edit">
                <Edit className="w-4 h-4 text-yellow-500" />
              </button>
              <button onClick={() => onAssign(pitak.id)} className="p-1.5 rounded hover:bg-gray-100" title="Assign Worker">
                <User className="w-4 h-4 text-green-600" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PitakGridView;