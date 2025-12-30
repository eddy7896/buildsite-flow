/**
 * Hook for CRM filters state
 */

import { useState, useCallback } from 'react';

export const useCRMFilters = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    clearFilters,
  };
};

