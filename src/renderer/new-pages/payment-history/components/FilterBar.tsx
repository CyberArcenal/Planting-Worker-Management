// src/renderer/pages/payment-history/components/FilterBar.tsx
import React, { useState, useEffect } from "react";
import type { PaymentHistoryFilters } from "../hooks/usePaymentHistories";
import type { Payment } from "../../../api/core/payment";
import paymentAPI from "../../../api/core/payment";

interface FilterBarProps {
  filters: PaymentHistoryFilters;
  onFilterChange: (key: keyof PaymentHistoryFilters, value: string | number | undefined) => void;
  onReset: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onReset }) => {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    paymentAPI.getAll({ limit: 100 })
      .then(res => {
        if (res.status) setPayments(res.data);
      })
      .catch(console.error);
  }, []);

  // Get unique action types from existing data? For simplicity, we use a static list.
  const actionTypes = ["CREATE", "UPDATE", "DELETE", "STATUS_CHANGE", "PAYMENT"];

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
          placeholder="Notes, performed by..."
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

      {/* Action Type */}
      <div>
        <label className="block text-sm font-medium mb-xs" style={{ color: "var(--sidebar-text)" }}>
          Action Type
        </label>
        <select
          value={filters.actionType}
          onChange={(e) => onFilterChange("actionType", e.target.value)}
          className="compact-input w-full border rounded-md"
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--border-color)",
            color: "var(--sidebar-text)",
          }}
        >
          <option value="all">All Actions</option>
          {actionTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Payment */}
      <div>
        <label className="block text-sm font-medium mb-xs" style={{ color: "var(--sidebar-text)" }}>
          Payment ID
        </label>
        <select
          value={filters.paymentId}
          onChange={(e) => onFilterChange("paymentId", e.target.value === "all" ? "all" : Number(e.target.value))}
          className="compact-input w-full border rounded-md"
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--border-color)",
            color: "var(--sidebar-text)",
          }}
        >
          <option value="all">All Payments</option>
          {payments.map((p) => (
            <option key={p.id} value={p.id}>
              #{p.id} - {p.worker?.name} (₱{p.netPay})
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