// src/renderer/pages/sessions/hooks/useSessions.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import type { Session } from "../../../api/core/session";
import sessionAPI from "../../../api/core/session";

export interface SessionFilters {
  search: string;
  status: "all" | "active" | "closed" | "archived";
  seasonType: "all" | "tag-ulan" | "tag-araw" | "custom";
  year?: number;
}

export const useSessions = () => {
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SessionFilters>({
    search: "",
    status: "all",
    seasonType: "all",
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "startDate",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await sessionAPI.getAll();
      if (response.status) {
        setAllSessions(response.data);
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

  const filteredSessions = useMemo(() => {
    let filtered = allSessions.filter((s) => {
      // search by name, notes
      if (filters.search) {
        const term = filters.search.toLowerCase();
        if (
          !s.name.toLowerCase().includes(term) &&
          !(s.notes?.toLowerCase() || "").includes(term)
        ) {
          return false;
        }
      }
      // status filter
      if (filters.status !== "all" && s.status !== filters.status) return false;
      // season type filter
      if (filters.seasonType !== "all" && s.seasonType !== filters.seasonType) return false;
      // year filter
      if (filters.year && s.year !== filters.year) return false;
      return true;
    });

    // sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key as keyof Session];
        let bVal = b[sortConfig.key as keyof Session];
        if (sortConfig.key === "startDate" || sortConfig.key === "endDate" || sortConfig.key === "createdAt") {
          aVal = aVal ? new Date(aVal as string).getTime() : 0;
          bVal = bVal ? new Date(bVal as string).getTime() : 0;
        } else if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [allSessions, filters, sortConfig]);

  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSessions.slice(start, start + pageSize);
  }, [filteredSessions, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredSessions.length / pageSize);

  const handleFilterChange = (key: keyof SessionFilters, value: string | number | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({ search: "", status: "all", seasonType: "all", year: undefined });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  const toggleSessionSelection = (id: number) => {
    setSelectedSessions((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSessions.length === paginatedSessions.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(paginatedSessions.map((s) => s.id));
    }
  };

  return {
    sessions: paginatedSessions,
    allSessions,
    filters,
    loading,
    error,
    pagination: {
      total: filteredSessions.length,
      totalPages,
    },
    selectedSessions,
    setSelectedSessions,
    sortConfig,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload: fetchAll,
    handleFilterChange,
    resetFilters,
    toggleSessionSelection,
    toggleSelectAll,
    handleSort,
  };
};