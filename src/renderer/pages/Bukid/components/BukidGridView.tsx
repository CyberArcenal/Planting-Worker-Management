// components/Bukid/components/BukidGridView.tsx
import React from "react";
import BukidGridCard from "./BukidGridCard";
import type { Bukid } from "../../../api/core/bukid";

interface BukidGridViewProps {
  bukids: Bukid[];
  selectedBukids: number[];
  toggleSelectBukid: (id: number) => void;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onUpdateStatus: (id: number, currentStatus: string) => void;
  onDelete: (id: number, name: string) => void;
}

const BukidGridView: React.FC<BukidGridViewProps> = ({
  bukids,
  selectedBukids,
  toggleSelectBukid,
  onView,
  onEdit,
  onUpdateStatus,
  onDelete,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bukids.map((bukid) => (
        <BukidGridCard
          key={bukid.id}
          bukid={bukid}
          isSelected={selectedBukids.includes(bukid.id)}
          onSelect={() => toggleSelectBukid(bukid.id)}
          onView={onView}
          onEdit={onEdit}
          onUpdateStatus={onUpdateStatus}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default BukidGridView;