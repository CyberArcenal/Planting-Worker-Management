// components/Bukid/components/BukidStats.tsx
import React from "react";
import { Home, CheckCircle, XCircle } from "lucide-react";

interface BukidStatsProps {
  stats: { total: number; active: number; inactive: number } | null;
}

const BukidStats: React.FC<BukidStatsProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div
        className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
        }}
      >
        <div className="flex justify-between items-start mb-4">
          <div
            className="p-3 rounded-lg"
            style={{ background: "var(--accent-green-light)" }}
          >
            <Home className="w-6 h-6" style={{ color: "var(--accent-green)" }} />
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{
              background: "var(--accent-green-light)",
              color: "var(--accent-green)",
            }}
          >
            Total
          </span>
        </div>
        <h3
          className="text-3xl font-bold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          {stats.total}
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Total Bukid
        </p>
      </div>

      <div
        className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
        }}
      >
        <div className="flex justify-between items-start mb-4">
          <div
            className="p-3 rounded-lg"
            style={{ background: "var(--accent-sky-light)" }}
          >
            <CheckCircle className="w-6 h-6" style={{ color: "var(--accent-sky)" }} />
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{
              background: "var(--accent-green-light)",
              color: "var(--accent-green)",
            }}
          >
            Active
          </span>
        </div>
        <h3
          className="text-3xl font-bold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          {stats.active}
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Active Bukid
        </p>
      </div>

      <div
        className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
        }}
      >
        <div className="flex justify-between items-start mb-4">
          <div
            className="p-3 rounded-lg"
            style={{ background: "var(--accent-rust-light)" }}
          >
            <XCircle className="w-6 h-6" style={{ color: "var(--accent-rust)" }} />
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{
              background: "var(--accent-rust-light)",
              color: "var(--accent-rust)",
            }}
          >
            Inactive
          </span>
        </div>
        <h3
          className="text-3xl font-bold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          {stats.inactive}
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Inactive Bukid
        </p>
      </div>
    </div>
  );
};

export default BukidStats;