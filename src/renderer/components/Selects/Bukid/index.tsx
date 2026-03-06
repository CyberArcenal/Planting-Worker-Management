// src/renderer/components/Selects/Bukid/index.tsx
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, TreePalm, X } from "lucide-react";
import type { Bukid } from "../../../api/core/bukid";
import bukidAPI from "../../../api/core/bukid";

interface BukidSelectProps {
  value: number | null;
  onChange: (bukidId: number | null, bukid?: Bukid) => void;
  disabled?: boolean;
  placeholder?: string;
  activeOnly?: boolean;
  className?: string;
}

const BukidSelect: React.FC<BukidSelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Select a farm...",
  activeOnly = true,
  className = "w-full max-w-md",
}) => {
  const [bukids, setBukids] = useState<Bukid[]>([]);
  const [filteredBukids, setFilteredBukids] = useState<Bukid[]>([]);
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

  // Load bukids
  useEffect(() => {
    const loadBukids = async () => {
      setLoading(true);
      try {
        const params: any = { limit: 1000 };
        if (activeOnly) {
          params.status = "active"; // assuming API supports filtering
        }
        const response = await bukidAPI.getAll(params);
        if (response.status && response.data) {
          let list = Array.isArray(response.data) ? response.data : response.data || [];
          if (activeOnly && !params.status) {
            list = list.filter((b) => b.status === "active");
          }
          setBukids(list);
          setFilteredBukids(list);
        }
      } catch (error) {
        console.error("Failed to load farms:", error);
      } finally {
        setLoading(false);
      }
    };
    loadBukids();
  }, [activeOnly]);

  // Filter bukids
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBukids(bukids);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setFilteredBukids(
      bukids.filter(
        (b) =>
          b.name.toLowerCase().includes(lower) ||
          (b.location && b.location.toLowerCase().includes(lower))
      )
    );
  }, [searchTerm, bukids]);

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

  const handleSelect = (bukid: Bukid) => {
    onChange(bukid.id, bukid);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const selectedBukid = bukids.find((b) => b.id === value);

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
        <TreePalm
          className="w-4 h-4 flex-shrink-0"
          style={{ color: "var(--primary-color)" }}
        />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {selectedBukid ? (
            <>
              <span className="font-medium truncate">{selectedBukid.name}</span>
              {selectedBukid.location && (
                <span
                  className="text-xs truncate"
                  style={{ color: "var(--text-secondary)" }}
                >
                  ({selectedBukid.location})
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
        {selectedBukid && !disabled && (
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
                  placeholder="Search by name or location..."
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
              {loading && bukids.length === 0 ? (
                <div
                  className="p-3 text-center text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Loading...
                </div>
              ) : filteredBukids.length === 0 ? (
                <div
                  className="p-3 text-center text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  No farms found
                </div>
              ) : (
                filteredBukids.map((bukid) => (
                  <button
                    key={bukid.id}
                    type="button"
                    onClick={() => handleSelect(bukid)}
                    className={`
                      w-full px-3 py-2 text-left flex items-center gap-2
                      transition-colors text-sm cursor-pointer hover:bg-[var(--card-hover-bg)]
                      ${bukid.id === value ? "bg-[var(--accent-blue-light)]" : ""}
                    `}
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    <TreePalm
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: "var(--primary-color)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <span
                        className="font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {bukid.name}
                      </span>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {bukid.location || "No location"} • {bukid.status}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default BukidSelect;