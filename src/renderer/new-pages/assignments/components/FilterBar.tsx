// src/renderer/pages/assignments/components/FilterBar.tsx
import React, { useState, useEffect } from "react";
import type { AssignmentFilters } from "../hooks/useAssignments";
import type { Pitak } from "../../../api/core/pitak";
import sessionAPI, { type Session } from "../../../api/core/session";
import workerAPI from "../../../api/core/worker";
import pitakAPI from "../../../api/core/pitak";
import type { Worker } from "../../../api/core/worker";
interface FilterBarProps {
  filters: AssignmentFilters;
  onFilterChange: (key: keyof AssignmentFilters, value: string | number) => void;
  onReset: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onReset }) => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [pitaks, setPitaks] = useState<Pitak[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    Promise.all([
      workerAPI.getAll({ limit: 100 }),
      pitakAPI.getAll({ limit: 100 }),
      sessionAPI.getAll({ limit: 100 }),
    ])
      .then(([workersRes, pitaksRes, sessionsRes]) => {
        if (workersRes.status) setWorkers(workersRes.data);
        if (pitaksRes.status) setPitaks(pitaksRes.data);
        if (sessionsRes.status) setSessions(sessionsRes.data);
      })
      .catch(console.error);
  }, []);

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-sm mb-4 compact-card rounded-md border p-3"
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
          placeholder="Worker, pitak, notes..."
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

      {/* Status */}
      <div>
        <label className="block text-sm font-medium mb-xs" style={{ color: "var(--sidebar-text)" }}>
          Status
        </label>
        <select
          value={filters.status}
          onChange={(e) => onFilterChange("status", e.target.value)}
          className="compact-input w-full border rounded-md"
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--border-color)",
            color: "var(--sidebar-text)",
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Worker */}
      <div>
        <label className="block text-sm font-medium mb-xs" style={{ color: "var(--sidebar-text)" }}>
          Worker
        </label>
        <select
          value={filters.workerId}
          onChange={(e) => onFilterChange("workerId", e.target.value === "all" ? "all" : Number(e.target.value))}
          className="compact-input w-full border rounded-md"
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--border-color)",
            color: "var(--sidebar-text)",
          }}
        >
          <option value="all">All Workers</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      {/* Pitak */}
      <div>
        <label className="block text-sm font-medium mb-xs" style={{ color: "var(--sidebar-text)" }}>
          Pitak
        </label>
        <select
          value={filters.pitakId}
          onChange={(e) => onFilterChange("pitakId", e.target.value === "all" ? "all" : Number(e.target.value))}
          className="compact-input w-full border rounded-md"
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--border-color)",
            color: "var(--sidebar-text)",
          }}
        >
          <option value="all">All Pitaks</option>
          {pitaks.map((p) => (
            <option key={p.id} value={p.id}>
              {p.location} (Bukid: {p.bukid?.name})
            </option>
          ))}
        </select>
      </div>

      {/* Session */}
      <div>
        <label className="block text-sm font-medium mb-xs" style={{ color: "var(--sidebar-text)" }}>
          Session
        </label>
        <select
          value={filters.sessionId}
          onChange={(e) => onFilterChange("sessionId", e.target.value === "all" ? "all" : Number(e.target.value))}
          className="compact-input w-full border rounded-md"
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--border-color)",
            color: "var(--sidebar-text)",
          }}
        >
          <option value="all">All Sessions</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.year})
            </option>
          ))}
        </select>
      </div>

      {/* Reset button */}
      <div className="flex items-end col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-5">
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