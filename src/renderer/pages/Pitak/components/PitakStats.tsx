// components/Pitak/components/PitakStats.tsx
import React from "react";
import { MapPin, CheckCircle, Hash, BarChart3 } from "lucide-react";
import type { PitakStats } from "../../../api/core/pitak";
import { formatNumber } from "../../../utils/formatters";

interface PitakStatsProps {
  stats: PitakStats | null;
}

const PitakStats: React.FC<PitakStatsProps> = ({ stats }) => {
  const activePitaks = stats?.statusBreakdown?.active || 0;
  const inactivePitaks = stats?.statusBreakdown?.inactive || 0;
  const completedPitaks = stats?.statusBreakdown?.completed || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg bg-white border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-lg bg-green-50">
            <MapPin className="w-6 h-6 text-green-600" />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
            Total
          </span>
        </div>
        <h3 className="text-3xl font-bold mb-1 text-gray-800">
          {stats?.totalPitaks || 0}
        </h3>
        <p className="text-sm text-gray-600">Total Pitak</p>
      </div>

      <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg bg-white border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-lg bg-blue-50">
            <CheckCircle className="w-6 h-6 text-blue-600" />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
            Active
          </span>
        </div>
        <h3 className="text-3xl font-bold mb-1 text-gray-800">
          {activePitaks}
        </h3>
        <p className="text-sm text-gray-600">Active Pitak</p>
      </div>

      <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg bg-white border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-lg bg-amber-50">
            <Hash className="w-6 h-6 text-amber-600" />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-600">
            Capacity
          </span>
        </div>
        <h3 className="text-3xl font-bold mb-1 text-gray-800">
          {formatNumber(stats?.totalArea || 0)} m²
        </h3>
        <p className="text-sm text-gray-600">Total Area</p>
      </div>

      <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg bg-white border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-lg bg-purple-50">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-600">
            Utilization
          </span>
        </div>
        <h3 className="text-3xl font-bold mb-1 text-gray-800">
          {stats?.totalPitaks ? ((activePitaks / stats.totalPitaks) * 100).toFixed(1) : "0"}%
        </h3>
        <p className="text-sm text-gray-600">Active Ratio</p>
      </div>
    </div>
  );
};

export default PitakStats;