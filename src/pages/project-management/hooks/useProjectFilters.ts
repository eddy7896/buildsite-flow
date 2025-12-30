/**
 * Hook for managing project filters state
 */

import { useState, useCallback, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { SavedView } from '@/components/project-management/fragments/types';

export const useProjectFilters = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [tagFilterOpen, setTagFilterOpen] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [currentViewId, setCurrentViewId] = useState<string | null>(null);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setSearchTerm('');
    setSelectedTags([]);
    setDateRange(undefined);
    setCurrentViewId(null);
  }, []);

  const saveCurrentView = useCallback((toast: any) => {
    const viewName = prompt('Enter a name for this view:');
    if (!viewName) return;
    
    const newView: SavedView = {
      id: Date.now().toString(),
      name: viewName,
      filters: {
        status: statusFilter,
        priority: priorityFilter,
        tags: selectedTags,
        dateRange: dateRange
      }
    };
    
    setSavedViews(prev => [...prev, newView]);
    setCurrentViewId(newView.id);
    toast({
      title: 'View Saved',
      description: `"${viewName}" has been saved`,
    });
  }, [statusFilter, priorityFilter, selectedTags, dateRange]);

  const loadSavedView = useCallback((viewId: string) => {
    const view = savedViews.find(v => v.id === viewId);
    if (!view) return;
    
    setStatusFilter(view.filters.status);
    setPriorityFilter(view.filters.priority);
    setSelectedTags(view.filters.tags);
    setDateRange(view.filters.dateRange);
    setCurrentViewId(viewId);
  }, [savedViews]);

  const handleSortChange = useCallback((value: string) => {
    const [field, order] = value.split('_');
    setSortBy(field);
    setSortOrder(order as 'asc' | 'desc');
  }, []);

  return {
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    searchTerm,
    setSearchTerm,
    selectedTags,
    setSelectedTags,
    dateRange,
    setDateRange,
    showArchived,
    setShowArchived,
    sortBy,
    sortOrder,
    tagFilterOpen,
    setTagFilterOpen,
    savedViews,
    currentViewId,
    toggleTag,
    clearAllFilters,
    saveCurrentView,
    loadSavedView,
    handleSortChange,
  };
};

