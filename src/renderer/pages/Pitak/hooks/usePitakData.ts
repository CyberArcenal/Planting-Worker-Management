// components/Pitak/hooks/usePitakData.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import type { Pitak, PitakStats } from "../../../api/core/pitak";
import pitakAPI from "../../../api/core/pitak";
import { showError } from "../../../utils/notification";

export const usePitakData = () => {
  const [allPitaks, setAllPitaks] = useState<Pitak[]>([]);
  const [stats, setStats] = useState<PitakStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [bukidFilter, setBukidFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [selectedPitaks, setSelectedPitaks] = useState<number[]>([]);

  // Fetch all pitaks with backend filters
  const fetchPitaks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (bukidFilter) params.bukidId = bukidFilter;
      params.limit = 1000; // fetch enough for client‑side filtering

      const response = await pitakAPI.getAll(params);
      if (response.status) {
        setAllPitaks(response.data);
      } else {
        throw new Error(response.message || "Failed to fetch pitaks");
      }
    } catch (err: any) {
      setError(err.message);
      showError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, bukidFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await pitakAPI.getStats();
      if (response.status) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch pitak stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchPitaks();
    fetchStats();
  }, [fetchPitaks, fetchStats]);

  // Client‑side search and sorting
  const filteredPitaks = useMemo(() => {
    let filtered = allPitaks;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.location?.toLowerCase().includes(q) ||
          p.bukid?.name?.toLowerCase().includes(q) ||
          p.notes?.toLowerCase().includes(q)
      );
    }
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case "location":
          aVal = a.location || "";
          bVal = b.location || "";
          break;
        case "createdAt":
          aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        case "totalLuwang":
          aVal = a.totalLuwang;
          bVal = b.totalLuwang;
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
  }, [allPitaks, searchQuery, sortBy, sortOrder]);

  // Pagination
  const totalItems = filteredPitaks.length;
  const totalPages = Math.ceil(totalItems / limit);
  const paginatedPitaks = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filteredPitaks.slice(start, start + limit);
  }, [filteredPitaks, currentPage, limit]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, bukidFilter, sortBy, sortOrder]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPitaks(), fetchStats()]);
  };

  return {
    pitaks: paginatedPitaks,
    allPitaks: filteredPitaks,
    stats,
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
    bukidFilter,
    setBukidFilter,
    viewMode,
    setViewMode,
    selectedPitaks,
    setSelectedPitaks,
    fetchPitaks,
    handleRefresh,
    setCurrentPage,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  };
};