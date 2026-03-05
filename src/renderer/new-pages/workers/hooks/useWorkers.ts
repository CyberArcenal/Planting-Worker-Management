// src/renderer/pages/workers/hooks/useWorkers.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import workerAPI from "../../../api/core/worker";
import type { Worker } from "../../../api/core/worker";
export interface WorkerFilters {
  search: string;
  status: "all" | "active" | "inactive" | "on-leave" | "terminated";
}

export const useWorkers = () => {
  const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<WorkerFilters>({
    search: "",
    status: "all",
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "name",
    direction: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedWorkers, setSelectedWorkers] = useState<number[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await workerAPI.getAll();
      if (response.status) {
        setAllWorkers(response.data);
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

  const filteredWorkers = useMemo(() => {
    let filtered = allWorkers.filter((w) => {
      // search by name, contact, email, address
      if (filters.search) {
        const term = filters.search.toLowerCase();
        if (
          !w.name.toLowerCase().includes(term) &&
          !(w.contact?.toLowerCase() || "").includes(term) &&
          !(w.email?.toLowerCase() || "").includes(term) &&
          !(w.address?.toLowerCase() || "").includes(term)
        ) {
          return false;
        }
      }
      // status filter
      if (filters.status !== "all" && w.status !== filters.status) return false;
      return true;
    });

    // sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key as keyof Worker];
        let bVal = b[sortConfig.key as keyof Worker];
        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();
        if (sortConfig.key === "hireDate") {
          aVal = a.hireDate ? new Date(a.hireDate).getTime() : 0;
          bVal = b.hireDate ? new Date(b.hireDate).getTime() : 0;
        }
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [allWorkers, filters, sortConfig]);

  const paginatedWorkers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredWorkers.slice(start, start + pageSize);
  }, [filteredWorkers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredWorkers.length / pageSize);

  const handleFilterChange = (key: keyof WorkerFilters, value: string) => {
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

  const toggleWorkerSelection = (id: number) => {
    setSelectedWorkers((prev) =>
      prev.includes(id) ? prev.filter((wid) => wid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedWorkers.length === paginatedWorkers.length) {
      setSelectedWorkers([]);
    } else {
      setSelectedWorkers(paginatedWorkers.map((w) => w.id));
    }
  };

  return {
    workers: paginatedWorkers,
    allWorkers,
    filters,
    loading,
    error,
    pagination: {
      total: filteredWorkers.length,
      totalPages,
    },
    selectedWorkers,
    setSelectedWorkers,
    sortConfig,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload: fetchAll,
    handleFilterChange,
    resetFilters,
    toggleWorkerSelection,
    toggleSelectAll,
    handleSort,
  };
};