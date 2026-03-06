// components/Assignment/hooks/useAssignmentData.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import assignmentAPI from "../../../api/core/assignment";
import type {
  Assignment,
  AssignmentStats,
} from "../../../api/core/assignment";

export const useAssignmentData = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]); // raw from API
  const [stats, setStats] = useState<AssignmentStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [workerFilter, setWorkerFilter] = useState<number | null>(null);
  const [pitakFilter, setPitakFilter] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("assignmentDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [selectedAssignments, setSelectedAssignments] = useState<number[]>([]);

  // ---------- Filter & Search (client‑side) ----------
  const filteredAssignments = useMemo(() => {
    let filtered = allAssignments;

    // Apply search (worker name, pitak name, notes)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.worker?.name?.toLowerCase().includes(query) ||
          a.pitak?.location?.toLowerCase().includes(query) ||
          a.notes?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allAssignments, searchQuery]);

  // ---------- Sorting ----------
  const sortedAssignments = useMemo(() => {
    const sorted = [...filteredAssignments];
    sorted.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case "assignmentDate":
          aVal = new Date(a.assignmentDate).getTime();
          bVal = new Date(b.assignmentDate).getTime();
          break;
        case "worker":
          aVal = a.worker?.name || "";
          bVal = b.worker?.name || "";
          break;
        case "pitak":
          aVal = a.pitak?.location || "";
          bVal = b.pitak?.location || "";
          break;
        case "luwangCount":
          aVal = a.luwangCount;
          bVal = b.luwangCount;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          aVal = a.id;
          bVal = b.id;
      }
      if (sortOrder === "asc") return aVal > bVal ? 1 : -1;
      else return aVal < bVal ? 1 : -1;
    });
    return sorted;
  }, [filteredAssignments, sortBy, sortOrder]);

  // ---------- Pagination ----------
  const totalItems = sortedAssignments.length;
  const totalPages = Math.ceil(totalItems / limit);
  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return sortedAssignments.slice(start, start + limit);
  }, [sortedAssignments, currentPage, limit]);

  // Reset page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, workerFilter, pitakFilter, dateFrom, dateTo]);

  // ---------- Data fetching ----------
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (workerFilter) params.workerId = workerFilter;
      if (pitakFilter) params.pitakId = pitakFilter;
      if (dateFrom) params.startDate = dateFrom;   // new API uses startDate
      if (dateTo) params.endDate = dateTo;         // new API uses endDate

      const response = await assignmentAPI.getAll(params);
      if (response.status) {
        setAllAssignments(response.data);
      } else {
        throw new Error(response.message || "Failed to fetch assignments");
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Failed to fetch assignments:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, workerFilter, pitakFilter, dateFrom, dateTo]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await assignmentAPI.getStats(); // new method
      if (response.status) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch assignment stats:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Fetch stats after assignments change (or on mount)
  useEffect(() => {
    if (allAssignments.length > 0) fetchStats();
  }, [allAssignments, fetchStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAssignments();
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setWorkerFilter(null);
    setPitakFilter(null);
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
  };

  return {
    assignments: paginatedAssignments,
    allAssignments,
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
    workerFilter,
    setWorkerFilter,
    pitakFilter,
    setPitakFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    viewMode,
    setViewMode,
    selectedAssignments,
    setSelectedAssignments,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    fetchAssignments,
    handleRefresh,
    setCurrentPage,
    clearFilters,
  };
};