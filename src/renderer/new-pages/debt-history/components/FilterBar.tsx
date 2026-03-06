// src/renderer/pages/debt-history/components/FilterBar.tsx
import React, { useState, useEffect } from "react";
import type { DebtHistoryFilters } from "../hooks/useDebtHistories";
import type { Debt } from "../../../api/core/debt";
import debtAPI from "../../../api/core/debt";

interface FilterBarProps {
  filters: DebtHistoryFilters;
  onFilterChange: (key: keyof DebtHistoryFilters, value: string | number | undefined) => void;
  onReset: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onReset }) => {
  const [debts, setDebts] = useState<Debt[]>([]);

  useEffect(() => {
    debtAPI.getAll({ limit: 100 })
      .then(res => {
        if (res.status) setDebts(res.data);
      })
      .catch(console.error);
  }, []);

  // Common transaction types from the entity
  const transactionTypes = ["PAYMENT", "ADJUSTMENT", "INTEREST", "WRITE_OFF"];

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-sm mb-4 compact-card rounded-md border p-3"
      style={{
        backgroundColor: "var(--card-secondary-bg)",
        borderColor: "var(--border-color)",
      }}
    >
      {/* Search */}
      <div>
        <label className="block text-sm font-medium mb-xs" style={{ color: "var(--sidebar-text)" }}>
          Search
        </label>
        <input
          type="text"
          placeholder="Notes, reference..."
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          className="compact-input w-full border rounded-md"
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--border-color)",
            color: "var(--sidebar-text)",
          }}
        />
      </div>

      {/* Transaction Type */}
      <div>
        <label className="block text-sm font-medium mb-xs" style={{ color: "var(--sidebar-text)" }}>
          Transaction Type
        </label>
        <select
          value={filters.transactionType}
          onChange={(e) => onFilterChange("transactionType", e.target.value)}
          className="compact-input w-full border rounded-md"
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--border-color)",
            color: "var(--sidebar-text)",
          }}
        >
          <option value="all">All Types</option>
          {transactionTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Debt */}
      <div>
        <label className="block text-sm font-medium mb-xs" style={{ color: "var(--sidebar-text)" }}>
          Debt ID
        </label>
        <select
          value={filters.debtId}
          onChange={(e) => onFilterChange("debtId", e.target.value === "all" ? "all" : Number(e.target.value))}
          className="compact-input w-full border rounded-md"
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--border-color)",
            color: "var(--sidebar-text)",
          }}
        >
          <option value="all">All Debts</option>
          {debts.map((d) => (
            <option key={d.id} value={d.id}>
              #{d.id} - {d.worker?.name} (₱{d.amount})
            </option>
          ))}
        </select>
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-sm font-medium mb-xs" style={{ color: "var(--sidebar-text)" }}>
          From Date
        </label>
        <input
          type="date"
          value={filters.startDate || ""}
          onChange={(e) => onFilterChange("startDate", e.target.value || undefined)}
          className="compact-input w-full border rounded-md"
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--border-color)",
            color: "var(--sidebar-text)",
          }}
        />
      </div>

      {/* End Date */}
      <div>
        <label className="block text-sm font-medium mb-xs" style={{ color: "var(--sidebar-text)" }}>
          To Date
        </label>
        <input
          type="date"
          value={filters.endDate || ""}
          onChange={(e) => onFilterChange("endDate", e.target.value || undefined)}
          className="compact-input w-full border rounded-md"
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--border-color)",
            color: "var(--sidebar-text)",
          }}
        />
      </div>

      {/* Reset button */}
      <div className="flex items-end col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
        <button
          onClick={onReset}
          className="compact-button w-full rounded-md transition-colors"
          style={{
            backgroundColor: "var(--primary-color)",
            color: "var(--sidebar-text)",
          }}
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default FilterBar;