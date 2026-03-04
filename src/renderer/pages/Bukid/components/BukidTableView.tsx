// components/Bukid/components/BukidTableView.tsx
import React, { useState } from "react";
import { ChevronRight as ChevronRightIcon } from "lucide-react";
import BukidTableRow from "./BukidTableRow";
import type { Bukid } from "../../../api/core/bukid";

interface BukidTableViewProps {
  bukids: Bukid[];
  selectedBukids: number[];
  toggleSelectAll: () => void;
  toggleSelectBukid: (id: number) => void;
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
  sortBy: string;
  sortOrder: "ASC" | "DESC";
  onSort: (field: string) => void;
}

const BukidTableView: React.FC<BukidTableViewProps> = ({
  bukids,
  selectedBukids,
  toggleSelectAll,
  toggleSelectBukid,
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
  sortBy,
  sortOrder,
  onSort,
}) => {
  const [expandedBukid, setExpandedBukid] = useState<number | null>(null);

  const toggleExpandBukid = (id: number) => {
    setExpandedBukid((prev) => (prev === id ? null : id));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: "var(--table-header-bg)" }}>
              <th className="p-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedBukids.length === bukids.length && bukids.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="p-4 text-left text-sm font-medium text-gray-600">
                <button onClick={() => onSort("name")} className="flex items-center gap-1">
                  Name
                  {sortBy === "name" && (
                    <ChevronRightIcon
                      className={`w-3 h-3 transform ${sortOrder === "ASC" ? "rotate-90" : "-rotate-90"}`}
                    />
                  )}
                </button>
              </th>
              <th className="p-4 text-left text-sm font-medium text-gray-600">Location</th>
              <th className="p-4 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="p-4 text-left text-sm font-medium text-gray-600">
                <button onClick={() => onSort("createdAt")} className="flex items-center gap-1">
                  Created
                  {sortBy === "createdAt" && (
                    <ChevronRightIcon
                      className={`w-3 h-3 transform ${sortOrder === "ASC" ? "rotate-90" : "-rotate-90"}`}
                    />
                  )}
                </button>
              </th>
              <th className="p-4 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bukids.map((bukid) => (
              <BukidTableRow
                key={bukid.id}
                bukid={bukid}
                isSelected={selectedBukids.includes(bukid.id)}
                isExpanded={expandedBukid === bukid.id}
                onSelect={() => toggleSelectBukid(bukid.id)}
                onToggleExpand={() => toggleExpandBukid(bukid.id)}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onUpdateStatus={onUpdateStatus}
                onAddNote={onAddNote}
                onViewStats={onViewStats}
                onImportCSV={onImportCSV}
                onExportCSV={onExportCSV}
                onAddPlot={onAddPlot}
                onViewPlots={onViewPlots}
                onViewNote={onViewNote}
                onComplete={onComplete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BukidTableView;