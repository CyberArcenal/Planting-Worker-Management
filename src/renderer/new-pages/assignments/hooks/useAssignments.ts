// src/renderer/pages/assignments/hooks/useAssignments.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import type { Assignment } from "../../../api/core/assignment";
import assignmentAPI from "../../../api/core/assignment";

export interface AssignmentFilters {
  search: string;
  status: "all" | "active" | "completed" | "cancelled";
  workerId: number | "all";
  pitakId: number | "all";
  sessionId: number | "all";
}

export const useAssignments = () => {
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AssignmentFilters>({
    search: "",
    status: "all",
    workerId: "all",
    pitakId: "all",
    sessionId: "all",
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "assignmentDate",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedAssignments, setSelectedAssignments] = useState<number[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await assignmentAPI.getAll();
      if (response.status) {
        setAllAssignments(response.data);
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

  const filteredAssignments = useMemo(() => {
    let filtered = allAssignments?.filter((a) => {
      // search by worker name, pitak location, notes
      if (filters.search) {
        const term = filters.search.toLowerCase();
        const workerName = a.worker?.name?.toLowerCase() || "";
        const pitakLocation = a.pitak?.location?.toLowerCase() || "";
        const notes = a.notes?.toLowerCase() || "";
        if (
          !workerName.includes(term) &&
          !pitakLocation.includes(term) &&
          !notes.includes(term)
        ) {
          return false;
        }
      }
      // status filter
      if (filters.status !== "all" && a.status !== filters.status) return false;
      // worker filter
      if (filters.workerId !== "all" && a.worker?.id !== filters.workerId) return false;
      // pitak filter
      if (filters.pitakId !== "all" && a.pitak?.id !== filters.pitakId) return false;
      // session filter
      if (filters.sessionId !== "all" && a.session?.id !== filters.sessionId) return false;
      return true;
    });

    // sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key as keyof Assignment];
        let bVal = b[sortConfig.key as keyof Assignment];
        // Handle nested fields
        if (sortConfig.key === "worker") {
          aVal = a.worker?.name || "";
          bVal = b.worker?.name || "";
        } else if (sortConfig.key === "pitak") {
          aVal = a.pitak?.location || "";
          bVal = b.pitak?.location || "";
        } else if (sortConfig.key === "session") {
          aVal = a.session?.name || "";
          bVal = b.session?.name || "";
        }
        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [allAssignments, filters, sortConfig]);

  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAssignments.slice(start, start + pageSize);
  }, [filteredAssignments, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAssignments.length / pageSize);

  const handleFilterChange = (key: keyof AssignmentFilters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({ search: "", status: "all", workerId: "all", pitakId: "all", sessionId: "all" });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  const toggleAssignmentSelection = (id: number) => {
    setSelectedAssignments((prev) =>
      prev.includes(id) ? prev.filter((aid) => aid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAssignments.length === paginatedAssignments.length) {
      setSelectedAssignments([]);
    } else {
      setSelectedAssignments(paginatedAssignments.map((a) => a.id));
    }
  };

  return {
    assignments: paginatedAssignments,
    allAssignments,
    filters,
    loading,
    error,
    pagination: {
      total: filteredAssignments.length,
      totalPages,
    },
    selectedAssignments,
    setSelectedAssignments,
    sortConfig,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload: fetchAll,
    handleFilterChange,
    resetFilters,
    toggleAssignmentSelection,
    toggleSelectAll,
    handleSort,
  };
};