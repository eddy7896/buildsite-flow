/**
 * Hook for project filtering and sorting
 */

import { useMemo } from 'react';
import { Project } from '../utils/projectUtils';

export const useProjectFilters = (
  projects: Project[],
  searchTerm: string,
  statusFilter: string,
  priorityFilter: string,
  sortBy: string,
  sortOrder: 'asc' | 'desc'
) => {
  const filteredProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      const matchesSearch = !searchTerm || 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.project_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const normalizedStatus = project.status === 'in_progress' ? 'in-progress' : 
                               project.status === 'on_hold' ? 'on-hold' : project.status;
      const matchesStatus = statusFilter === 'all' || normalizedStatus === statusFilter;
      
      const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'budget':
          comparison = (b.budget || 0) - (a.budget || 0);
          break;
        case 'progress':
          comparison = b.progress - a.progress;
          break;
        case 'start_date':
          comparison = (a.start_date || '').localeCompare(b.start_date || '');
          break;
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          comparison = (priorityOrder[b.priority || 'medium'] || 0) - (priorityOrder[a.priority || 'medium'] || 0);
          break;
        case 'created_at':
        default:
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return filtered;
  }, [projects, searchTerm, statusFilter, priorityFilter, sortBy, sortOrder]);

  return filteredProjects;
};

