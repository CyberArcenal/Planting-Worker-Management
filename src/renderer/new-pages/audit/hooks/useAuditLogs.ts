// src/renderer/pages/audit/hooks/useAuditLogs.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import auditLogAPI, { type AuditLogEntry } from '../../../api/core/audit';

export interface AuditFilters {
  search: string;
  entity: string;
  action: string;
  user: string;
  startDate: string;
  endDate: string;
}

export const useAuditLogs = () => {
  const [allLogs, setAllLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditFilters>({
    search: '',
    entity: '',
    action: '',
    user: '',
    startDate: '',
    endDate: '',
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'timestamp',
    direction: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await auditLogAPI.getAll();
      if (response.status) {
        setAllLogs(response.data);
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

  // Apply filters, sorting, pagination
  const filteredLogs = useMemo(() => {
    let filtered = allLogs.filter(log => {
      // global search (action, entity, description, user)
      if (filters.search) {
        const term = filters.search.toLowerCase();
        if (
          !log.action.toLowerCase().includes(term) &&
          !log.entity.toLowerCase().includes(term) &&
          !(log.description?.toLowerCase() || '').includes(term) &&
          !(log.user?.toLowerCase() || '').includes(term)
        ) {
          return false;
        }
      }
      // entity filter
      if (filters.entity && log.entity.toLowerCase() !== filters.entity.toLowerCase()) return false;
      // action filter
      if (filters.action && log.action.toLowerCase() !== filters.action.toLowerCase()) return false;
      // user filter
      if (filters.user) {
        const term = filters.user.toLowerCase();
        if (!(log.user?.toLowerCase() || '').includes(term)) return false;
      }
      // date range
      if (filters.startDate) {
        const logDate = new Date(log.timestamp);
        if (logDate < new Date(filters.startDate)) return false;
      }
      if (filters.endDate) {
        const logDate = new Date(log.timestamp);
        if (logDate > new Date(filters.endDate)) return false;
      }
      return true;
    });

    // sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal: any = a[sortConfig.key as keyof AuditLogEntry];
        let bVal: any = b[sortConfig.key as keyof AuditLogEntry];
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [allLogs, filters, sortConfig]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize);

  const handleFilterChange = (key: keyof AuditFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      entity: '',
      action: '',
      user: '',
      startDate: '',
      endDate: '',
    });
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  const toggleLogSelection = (id: number) => {
    setSelectedLogs(prev =>
      prev.includes(id) ? prev.filter(lid => lid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLogs.length === paginatedLogs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(paginatedLogs.map(l => l.id));
    }
  };

  return {
    logs: paginatedLogs,
    allLogs,
    filters,
    loading,
    error,
    pagination: {
      total: filteredLogs.length,
      totalPages,
    },
    selectedLogs,
    setSelectedLogs,
    sortConfig,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload: fetchAll,
    handleFilterChange,
    resetFilters,
    toggleLogSelection,
    toggleSelectAll,
    handleSort,
  };
};