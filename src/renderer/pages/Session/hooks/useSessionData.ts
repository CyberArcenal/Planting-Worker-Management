// components/Session/hooks/useSessionData.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import sessionAPI from "../../../api/core/session";
import type { Session, SessionStats } from "../../../api/core/session";
import { showError } from "../../../utils/notification";

export const useSessionData = () => {
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed" | "archived">("all");
  const [yearFilter, setYearFilter] = useState<number | "all">("all");
  const [seasonTypeFilter, setSeasonTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("startDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);

  // Fetch all sessions with backend filters (except search & seasonType)
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        limit: 1000, // fetch enough for client‑side filtering
      };
      if (statusFilter !== "all") params.status = statusFilter;
      if (yearFilter !== "all") params.year = yearFilter;

      const response = await sessionAPI.getAll(params);
      if (response.status) {
        setAllSessions(response.data);
      } else {
        throw new Error(response.message || "Failed to fetch sessions");
      }
    } catch (err: any) {
      setError(err.message);
      showError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, yearFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await sessionAPI.getStats();
      if (response.status) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch session stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchStats();
  }, [fetchSessions, fetchStats]);

  // Client‑side filtering (search, seasonType) and sorting
  const filteredSessions = useMemo(() => {
    let filtered = allSessions;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(q));
    }

    if (seasonTypeFilter !== "all") {
      filtered = filtered.filter((s) => s.seasonType === seasonTypeFilter);
    }

    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "year":
          aVal = a.year;
          bVal = b.year;
          break;
        case "startDate":
          aVal = a.startDate ? new Date(a.startDate).getTime() : 0;
          bVal = b.startDate ? new Date(b.startDate).getTime() : 0;
          break;
        case "endDate":
          aVal = a.endDate ? new Date(a.endDate).getTime() : 0;
          bVal = b.endDate ? new Date(b.endDate).getTime() : 0;
          break;
        default:
          aVal = a.id;
          bVal = b.id;
      }
      if (aVal === bVal) return 0;
      const compare = aVal > bVal ? 1 : -1;
      return sortOrder === "asc" ? compare : -compare;
    });

    return filtered;
  }, [allSessions, searchQuery, seasonTypeFilter, sortBy, sortOrder]);

  // Pagination
  const totalItems = filteredSessions.length;
  const totalPages = Math.ceil(totalItems / limit);
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filteredSessions.slice(start, start + limit);
  }, [filteredSessions, currentPage, limit]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, yearFilter, seasonTypeFilter, sortBy, sortOrder]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSessions(), fetchStats()]);
  };

  // Compute totalBukids from sessions (for stats)
  const totalBukids = useMemo(() => {
    return filteredSessions.reduce((sum, s) => sum + (s.bukids?.length || 0), 0);
  }, [filteredSessions]);

  return {
    sessions: paginatedSessions,
    allSessions: filteredSessions,
    stats,
    totalBukids,
    loading,
    refreshing,
    error,
    currentPage,
    totalPages,
    totalItems,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    yearFilter,
    setYearFilter,
    seasonTypeFilter,
    setSeasonTypeFilter,
    viewMode,
    setViewMode,
    selectedSessions,
    setSelectedSessions,
    fetchSessions,
    handleRefresh,
    setCurrentPage,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  };
};