// src/renderer/pages/bukid/hooks/useBukids.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import type { Bukid } from "../../../api/core/bukid";
import bukidAPI from "../../../api/core/bukid";

export interface BukidFilters {
  search: string;
  status: "all" | "active" | "inactive" | "completed" | "initiated";
}

export const useBukids = () => {
  const [allBukids, setAllBukids] = useState<Bukid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BukidFilters>({
    search: "",
    status: "all",
  });
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "createdAt",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedBukids, setSelectedBukids] = useState<number[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bukidAPI.getAll();
      if (response.status) {
        setAllBukids(response.data);
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

  const filteredBukids = useMemo(() => {
    let filtered = allBukids.filter((b) => {
      // search by name, location, notes
      if (filters.search) {
        const term = filters.search.toLowerCase();
        if (
          !b.name.toLowerCase().includes(term) &&
          !(b.location?.toLowerCase() || "").includes(term) &&
          !(b.notes?.toLowerCase() || "").includes(term)
        ) {
          return false;
        }
      }
      // status filter
      if (filters.status !== "all" && b.status !== filters.status) return false;
      return true;
    });

    // sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key as keyof Bukid];
        let bVal = b[sortConfig.key as keyof Bukid];
        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [allBukids, filters, sortConfig]);

  const paginatedBukids = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBukids.slice(start, start + pageSize);
  }, [filteredBukids, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredBukids.length / pageSize);

  const handleFilterChange = (key: keyof BukidFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({ search: "", status: "all" });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  const toggleBukidSelection = (id: number) => {
    setSelectedBukids((prev) =>
      prev.includes(id) ? prev.filter((bid) => bid !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedBukids.length === paginatedBukids.length) {
      setSelectedBukids([]);
    } else {
      setSelectedBukids(paginatedBukids.map((b) => b.id));
    }
  };

  return {
    bukids: paginatedBukids,
    allBukids,
    filters,
    loading,
    error,
    pagination: {
      total: filteredBukids.length,
      totalPages,
    },
    selectedBukids,
    setSelectedBukids,
    sortConfig,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload: fetchAll,
    handleFilterChange,
    resetFilters,
    toggleBukidSelection,
    toggleSelectAll,
    handleSort,
  };
};
