// src/renderer/components/Selects/Worker/index.tsx
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, User, X } from "lucide-react";
import type { Worker } from "../../../api/core/worker";
import workerAPI from "../../../api/core/worker";

interface WorkerSelectProps {
  value: number | null;
  onChange: (workerId: number | null, worker?: Worker) => void;
  disabled?: boolean;
  placeholder?: string;
  activeOnly?: boolean;
  className?: string;
}

const WorkerSelect: React.FC<WorkerSelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Select a worker...",
  activeOnly = true,
  className = "w-full max-w-md",
}) => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load workers
  useEffect(() => {
    const loadWorkers = async () => {
      setLoading(true);
      try {
        const params: any = {
          sortBy: "name",
          sortOrder: "ASC",
          limit: 1000,
        };
        if (activeOnly) {
          params.status = "active"; // adjust based on API; maybe fetch all and filter client-side
        }
        const response = await workerAPI.getAll(params);
        if (response.status && response.data) {
          let list = Array.isArray(response.data) ? response.data : response.data || [];
          if (activeOnly) {
            list = list.filter((w) => w.status === "active" || w.status === "on-leave");
          }
          setWorkers(list);
          setFilteredWorkers(list);
        }
      } catch (error) {
        console.error("Failed to load workers:", error);
      } finally {
        setLoading(false);
      }
    };
    loadWorkers();
  }, [activeOnly]);

  // Filter workers
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredWorkers(workers);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setFilteredWorkers(
      workers.filter(
        (w) =>
          w.name.toLowerCase().includes(lower) ||
          (w.contact && w.contact.toLowerCase().includes(lower)) ||
          (w.email && w.email.toLowerCase().includes(lower))
      )
    );
  }, [searchTerm, workers]);

  // Focus search when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Update dropdown position
  const updateDropdownPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener("scroll", updateDropdownPosition, true);
      window.addEventListener("resize", updateDropdownPosition);
    }
    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (worker: Worker) => {
    onChange(worker.id, worker);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const selectedWorker = workers.find((w) => w.id === value);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return { bg: "#d1fae5", text: "#065f46" };
      case "on-leave":
        return { bg: "#fef3c7", text: "#92400e" };
      case "inactive":
        return { bg: "#f3f4f6", text: "#6b7280" };
      case "terminated":
        return { bg: "#fee2e2", text: "#991b1b" };
      default:
        return { bg: "#f3f4f6", text: "#6b7280" };
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-2 rounded-lg text-left flex items-center gap-2
          transition-colors duration-200
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-800"}
        `}
        style={{
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          color: "var(--text-primary)",
          minHeight: "42px",
        }}
      >
        <User
          className="w-4 h-4 flex-shrink-0"
          style={{ color: "var(--primary-color)" }}
        />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {selectedWorker ? (
            <>
              <span className="font-medium truncate">{selectedWorker.name}</span>
              {selectedWorker.contact && (
                <span
                  className="text-xs truncate"
                  style={{ color: "var(--text-secondary)" }}
                >
                  ({selectedWorker.contact})
                </span>
              )}
            </>
          ) : (
            <span
              className="truncate"
              style={{ color: "var(--text-secondary)" }}
            >
              {placeholder}
            </span>
          )}
        </div>
        {selectedWorker && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full hover:bg-gray-700 transition-colors flex-shrink-0"
            style={{ color: "var(--text-secondary)" }}
            title="Remove selected"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
          style={{ color: "var(--text-secondary)" }}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] rounded-lg shadow-lg overflow-hidden"
            style={{
              top: dropdownStyle.top,
              left: dropdownStyle.left,
              width: dropdownStyle.width,
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              maxHeight: "350px",
            }}
          >
            <div
              className="p-2 border-b"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="relative">
                <Search
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--text-secondary)" }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by name, contact, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded text-sm"
                  style={{
                    backgroundColor: "var(--card-secondary-bg)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: "250px" }}>
              {loading && workers.length === 0 ? (
                <div
                  className="p-3 text-center text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Loading...
                </div>
              ) : filteredWorkers.length === 0 ? (
                <div
                  className="p-3 text-center text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  No workers found
                </div>
              ) : (
                filteredWorkers.map((worker) => {
                  const colors = getStatusColor(worker.status);
                  return (
                    <button
                      key={worker.id}
                      type="button"
                      onClick={() => handleSelect(worker)}
                      className={`
                        w-full px-3 py-2 text-left flex items-center gap-2
                        transition-colors text-sm cursor-pointer hover:bg-[var(--card-hover-bg)]
                        ${worker.id === value ? "bg-[var(--accent-blue-light)]" : ""}
                      `}
                      style={{ borderBottom: "1px solid var(--border-color)" }}
                    >
                      <User
                        className="w-3.5 h-3.5 flex-shrink-0"
                        style={{ color: "var(--primary-color)" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-medium truncate"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {worker.name}
                          </span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: colors.bg,
                              color: colors.text,
                            }}
                          >
                            {worker.status}
                          </span>
                        </div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {worker.contact || worker.email || "No contact"}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default WorkerSelect;