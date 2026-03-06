// src/renderer/pages/pitak/hooks/usePitaks.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import type { Pitak } from "../../../api/core/pitak";
import pitakAPI from "../../../api/core/pitak";

export interface PitakFilters {
  search: string;
  status: "all" | "active" | "inactive" | "archived";
  bukidId: number | "all";
}

export const usePitaks = () => {
  const [allPitaks, setAllPitaks] = useState<Pitak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PitakFilters>({
    search: "",
    status: "all",
    bukidId: "all",
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "createdAt",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPitaks, setSelectedPitaks] = useState<number[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await pitakAPI.getAll();
      if (response.status) {
        setAllPitaks(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredPitaks = useMemo(() => {
    let filtered = allPitaks.filter((p) => {
      // search by location, notes
      if (filters.search) {
        const term = filters.search.toLowerCase();
        if (
          !p.location.toLowerCase().includes(term) &&
          !(p.notes?.toLowerCase() || "").includes(term)
        ) {
          return false;
        }
      }
      // status filter
      if (filters.status !== "all" && p.status !== filters.status) return false;
      // bukid filter
      if (filters.bukidId !== "all" && p.bukid?.id !== filters.bukidId) return false;
      return true;
    });

    // sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key as keyof Pitak];
        let bVal = b[sortConfig.key as keyof Pitak];
        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [allPitaks, filters, sortConfig]);

  const paginatedPitaks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPitaks.slice(start, start + pageSize);
  }, [filteredPitaks, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredPitaks.length / pageSize);

  const handleFilterChange = (key: keyof PitakFilters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({ search: "", status: "all", bukidId: "all" });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  const togglePitakSelection = (id: number) => {
    setSelectedPitaks((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPitaks.length === paginatedPitaks.length) {
      setSelectedPitaks([]);
    } else {
      setSelectedPitaks(paginatedPitaks.map((p) => p.id));
    }
  };

  return {
    pitaks: paginatedPitaks,
    allPitaks,
    filters,
    loading,
    error,
    pagination: {
      total: filteredPitaks.length,
      totalPages,
    },
    selectedPitaks,
    setSelectedPitaks,
    sortConfig,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload: fetchAll,
    handleFilterChange,
    resetFilters,
    togglePitakSelection,
    toggleSelectAll,
    handleSort,
  };
};