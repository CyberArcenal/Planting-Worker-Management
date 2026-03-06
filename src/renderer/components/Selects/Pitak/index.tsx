// src/renderer/components/Selects/Pitak/index.tsx
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Layers, X } from "lucide-react";
import type { Pitak } from "../../../api/core/pitak";
import pitakAPI from "../../../api/core/pitak";

interface PitakSelectProps {
  value: number | null;
  onChange: (pitakId: number | null, pitak?: Pitak) => void;
  disabled?: boolean;
  placeholder?: string;
  activeOnly?: boolean;
  className?: string;
}

const PitakSelect: React.FC<PitakSelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Select a plot...",
  activeOnly = true,
  className = "w-full max-w-md",
}) => {
  const [pitaks, setPitaks] = useState<Pitak[]>([]);
  const [filteredPitaks, setFilteredPitaks] = useState<Pitak[]>([]);
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

  // Load pitaks
  useEffect(() => {
    const loadPitaks = async () => {
      setLoading(true);
      try {
        const params: any = { limit: 1000 };
        if (activeOnly) {
          params.status = "active"; // assuming API supports filtering
        }
        const response = await pitakAPI.getAll(params);
        if (response.status && response.data) {
          let list = Array.isArray(response.data) ? response.data : response.data || [];
          if (activeOnly && !params.status) {
            list = list.filter((p) => p.status === "active");
          }
          setPitaks(list);
          setFilteredPitaks(list);
        }
      } catch (error) {
        console.error("Failed to load plots:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPitaks();
  }, [activeOnly]);

  // Filter pitaks
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPitaks(pitaks);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setFilteredPitaks(
      pitaks.filter(
        (p) =>
          p.location?.toLowerCase().includes(lower) ||
          p.status?.toLowerCase().includes(lower) ||
          p.bukid?.name?.toLowerCase().includes(lower)
      )
    );
  }, [searchTerm, pitaks]);

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

  const handleSelect = (pitak: Pitak) => {
    onChange(pitak.id, pitak);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const selectedPitak = pitaks.find((p) => p.id === value);

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
        <Layers
          className="w-4 h-4 flex-shrink-0"
          style={{ color: "var(--primary-color)" }}
        />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {selectedPitak ? (
            <>
              <span className="font-medium truncate">
                {selectedPitak.location || `Plot #${selectedPitak.id}`}
              </span>
              {selectedPitak.bukid && (
                <span
                  className="text-xs truncate"
                  style={{ color: "var(--text-secondary)" }}
                >
                  ({selectedPitak.bukid.name})
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
        {selectedPitak && !disabled && (
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
                  placeholder="Search by location, status, farm..."
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
              {loading && pitaks.length === 0 ? (
                <div
                  className="p-3 text-center text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Loading...
                </div>
              ) : filteredPitaks.length === 0 ? (
                <div
                  className="p-3 text-center text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  No plots found
                </div>
              ) : (
                filteredPitaks.map((pitak) => (
                  <button
                    key={pitak.id}
                    type="button"
                    onClick={() => handleSelect(pitak)}
                    className={`
                      w-full px-3 py-2 text-left flex items-center gap-2
                      transition-colors text-sm cursor-pointer hover:bg-[var(--card-hover-bg)]
                      ${pitak.id === value ? "bg-[var(--accent-blue-light)]" : ""}
                    `}
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    <Layers
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: "var(--primary-color)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <span
                        className="font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {pitak.location || `Plot #${pitak.id}`}
                      </span>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {pitak.bukid?.name || "No farm"} • {pitak.status} • {pitak.totalLuwang} luwang
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

export default PitakSelect;