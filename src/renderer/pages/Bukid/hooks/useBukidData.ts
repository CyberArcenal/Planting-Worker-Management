// components/Bukid/hooks/useBukidData.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import type { Bukid } from "../../../api/core/bukid";
import bukidAPI from "../../../api/core/bukid";

export const useBukidData = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // All fetched bukids (raw)
  const [allBukids, setAllBukids] = useState<Bukid[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20); // items per page

  // Filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Sorting
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  // View mode
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [selectedBukids, setSelectedBukids] = useState<number[]>([]);

  // Fetch all bukids (with optional backend filters)
  const fetchBukids = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      // Note: search is not supported by backend, we do client‑side filtering

      const response = await bukidAPI.getAll(params);
      if (response.status) {
        setAllBukids(response.data);
      } else {
        throw new Error(response.message || "Failed to fetch bukids");
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching bukids:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  // Initial load
  useEffect(() => {
    fetchBukids();
  }, [fetchBukids]);

  // ---------- Client‑side filtering & sorting ----------
  const filteredBukids = useMemo(() => {
    let filtered = allBukids;

    // Apply search (by name or location)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          (b.location && b.location.toLowerCase().includes(q))
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortBy === "name") {
        aVal = a.name;
        bVal = b.name;
      } else if (sortBy === "createdAt") {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      } else {
        aVal = a[sortBy as keyof Bukid] ?? "";
        bVal = b[sortBy as keyof Bukid] ?? "";
      }
      if (sortOrder === "ASC") return aVal > bVal ? 1 : -1;
      else return aVal < bVal ? 1 : -1;
    });

    return sorted;
  }, [allBukids, searchQuery, sortBy, sortOrder]);

  // Pagination
  const totalItems = filteredBukids.length;
  const totalPages = Math.ceil(totalItems / limit);
  const paginatedBukids = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filteredBukids.slice(start, start + limit);
  }, [filteredBukids, currentPage, limit]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Simple stats from the filtered list (can be used in BukidStats)
  const stats = useMemo(() => {
    const total = filteredBukids.length;
    const active = filteredBukids.filter((b) => b.status === "active").length;
    const inactive = filteredBukids.filter((b) => b.status === "inactive").length;
    return { total, active, inactive };
  }, [filteredBukids]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBukids();
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  return {
    bukids: paginatedBukids,
    allBukids,
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
    viewMode,
    setViewMode,
    selectedBukids,
    setSelectedBukids,
    fetchBukids,
    handleRefresh,
    setCurrentPage,
    clearFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  };
};