// src/renderer/components/Selects/Assignment/index.tsx
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Calendar, User, X } from "lucide-react";
import type { Assignment } from "../../../api/core/assignment";
import assignmentAPI from "../../../api/core/assignment";

interface AssignmentSelectProps {
  value: number | null;
  onChange: (assignmentId: number | null, assignment?: Assignment) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  workerFilter?: number | null; // optional filter by worker
}

const AssignmentSelect: React.FC<AssignmentSelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Select an assignment...",
  className = "w-full max-w-md",
  workerFilter = null,
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
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

  // Load assignments
  useEffect(() => {
    const loadAssignments = async () => {
      setLoading(true);
      try {
        const params: any = { limit: 1000 };
        if (workerFilter) {
          params.workerId = workerFilter;
        }
        const response = await assignmentAPI.getAll(params);
        if (response.status && response.data) {
          const list = Array.isArray(response.data) ? response.data : response.data || [];
          setAssignments(list);
          setFilteredAssignments(list);
        }
      } catch (error) {
        console.error("Failed to load assignments:", error);
      } finally {
        setLoading(false);
      }
    };
    loadAssignments();
  }, [workerFilter]);

  // Filter assignments
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAssignments(assignments);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setFilteredAssignments(
      assignments.filter(
        (a) =>
          a.worker?.name?.toLowerCase().includes(lower) ||
          a.pitak?.location?.toLowerCase().includes(lower) ||
          a.status?.toLowerCase().includes(lower)
      )
    );
  }, [searchTerm, assignments]);

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

  const handleSelect = (assignment: Assignment) => {
    onChange(assignment.id, assignment);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const selectedAssignment = assignments.find((a) => a.id === value);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return { bg: "#d1fae5", text: "#065f46" };
      case "completed":
        return { bg: "#dbeafe", text: "#1e40af" };
      case "cancelled":
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
        <Calendar
          className="w-4 h-4 flex-shrink-0"
          style={{ color: "var(--primary-color)" }}
        />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {selectedAssignment ? (
            <>
              <span className="font-medium truncate">
                {selectedAssignment.worker?.name || "Unassigned"}
              </span>
              <span
                className="text-xs truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                ({selectedAssignment.pitak?.location || "No plot"} • {new Date(selectedAssignment.assignmentDate).toLocaleDateString()})
              </span>
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
        {selectedAssignment && !disabled && (
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
                  placeholder="Search by worker, plot, status..."
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
              {loading && assignments.length === 0 ? (
                <div
                  className="p-3 text-center text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Loading...
                </div>
              ) : filteredAssignments.length === 0 ? (
                <div
                  className="p-3 text-center text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  No assignments found
                </div>
              ) : (
                filteredAssignments.map((assignment) => {
                  const colors = getStatusColor(assignment.status);
                  return (
                    <button
                      key={assignment.id}
                      type="button"
                      onClick={() => handleSelect(assignment)}
                      className={`
                        w-full px-3 py-2 text-left flex items-center gap-2
                        transition-colors text-sm cursor-pointer hover:bg-[var(--card-hover-bg)]
                        ${assignment.id === value ? "bg-[var(--accent-blue-light)]" : ""}
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
                            {assignment.worker?.name || "Unassigned"}
                          </span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: colors.bg,
                              color: colors.text,
                            }}
                          >
                            {assignment.status}
                          </span>
                        </div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {assignment.pitak?.location || "No plot"} • {new Date(assignment.assignmentDate).toLocaleDateString()}
                          {assignment.luwangCount ? ` • ${assignment.luwangCount} luwang` : ""}
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

export default AssignmentSelect;