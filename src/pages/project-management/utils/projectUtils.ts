/**
 * Project Management utility functions
 */

import { Project } from "@/services/api/project-service";
import { HealthScore } from "@/components/project-management/fragments/types";

/**
 * Calculate health score for a project
 */
export const calculateHealthScore = (project: Project): HealthScore => {
  let score = 100;
  
  if (project.budget && project.actual_cost) {
    const variance = (project.actual_cost / project.budget) * 100;
    if (variance > 110) score -= 30;
    else if (variance > 100) score -= 15;
  }
  
  if (project.deadline) {
    const deadline = new Date(project.deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline < 0) score -= 25;
    else if (daysUntilDeadline < 7) score -= 10;
  }
  
  if (project.deadline) {
    const deadline = new Date(project.deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = project.start_date && project.end_date 
      ? Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    if (totalDays > 0 && daysUntilDeadline < totalDays * 0.3 && project.progress < 50) {
      score -= 15;
    }
  }
  
  const finalScore = Math.max(0, Math.min(100, score));
  
  return {
    score: finalScore,
    status: finalScore >= 70 ? 'healthy' : finalScore >= 40 ? 'warning' : 'critical'
  };
};

/**
 * Export projects to CSV
 */
export const exportProjectsToCSV = (projects: Project[]): void => {
  const headers = ['Project Name', 'Project Code', 'Client', 'Status', 'Priority', 'Progress (%)', 'Budget', 'Actual Cost', 'Start Date', 'End Date', 'Project Manager'];
  const rows = projects.map(project => [
    project.name || '',
    project.project_code || '',
    project.client?.company_name || project.client?.name || 'No Client',
    project.status.replace('_', ' ') || '',
    project.priority || 'medium',
    project.progress || 0,
    project.budget || 0,
    project.actual_cost || 0,
    project.start_date ? new Date(project.start_date).toLocaleDateString() : '',
    project.end_date ? new Date(project.end_date).toLocaleDateString() : '',
    project.project_manager?.full_name || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `projects_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Filter and sort projects
 */
export const filterAndSortProjects = (
  projects: Project[],
  filters: {
    statusFilter: string;
    priorityFilter: string;
    searchTerm: string;
    selectedTags: string[];
    dateRange?: { from?: Date; to?: Date };
    showArchived: boolean;
    deletingProjectId: string | null;
  },
  sort: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  },
  favoriteProjects: Set<string>
): Project[] => {
  let filtered = projects.filter(project => {
    if (filters.deletingProjectId === project.id) return false;
    
    if (!filters.showArchived && project.status === 'archived') return false;
    if (filters.showArchived && project.status !== 'archived') return false;
    
    if (filters.statusFilter !== 'all' && project.status !== filters.statusFilter) return false;
    
    if (filters.priorityFilter !== 'all' && project.priority !== filters.priorityFilter) return false;
    
    if (filters.selectedTags.length > 0) {
      const projectTags = project.tags || [];
      if (!filters.selectedTags.some(tag => projectTags.includes(tag))) return false;
    }
    
    if (filters.dateRange?.from || filters.dateRange?.to) {
      const projectStart = project.start_date ? new Date(project.start_date) : null;
      const projectEnd = project.end_date ? new Date(project.end_date) : null;
      
      if (filters.dateRange.from && projectEnd && projectEnd < filters.dateRange.from) return false;
      if (filters.dateRange.to && projectStart && projectStart > filters.dateRange.to) return false;
    }
    
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return (
        project.name.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower) ||
        project.project_code?.toLowerCase().includes(searchLower) ||
        project.client?.name?.toLowerCase().includes(searchLower) ||
        project.client?.company_name?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  filtered.sort((a, b) => {
    let comparison = 0;
    
    switch (sort.sortBy) {
      case 'name':
        comparison = (a.name || '').localeCompare(b.name || '');
        break;
      case 'status':
        comparison = (a.status || '').localeCompare(b.status || '');
        break;
      case 'priority':
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) - 
                     (priorityOrder[b.priority as keyof typeof priorityOrder] || 0);
        break;
      case 'budget':
        comparison = (a.budget || 0) - (b.budget || 0);
        break;
      case 'deadline':
        const aDeadline = a.deadline ? new Date(a.deadline).getTime() : 0;
        const bDeadline = b.deadline ? new Date(b.deadline).getTime() : 0;
        comparison = aDeadline - bDeadline;
        break;
      case 'progress':
        comparison = (a.progress || 0) - (b.progress || 0);
        break;
      case 'created_at':
      default:
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
    }
    
    return sort.sortOrder === 'asc' ? comparison : -comparison;
  });
  
  if (filters.statusFilter === 'favorites') {
    filtered.sort((a, b) => {
      const aFavorite = favoriteProjects.has(a.id);
      const bFavorite = favoriteProjects.has(b.id);
      if (aFavorite && !bFavorite) return -1;
      if (!aFavorite && bFavorite) return 1;
      return 0;
    });
  }
  
  return filtered;
};

/**
 * Extract all unique tags from projects
 */
export const extractAllTags = (projects: Project[]): string[] => {
  const tagSet = new Set<string>();
  projects.forEach(project => {
    if (project.tags && Array.isArray(project.tags)) {
      project.tags.forEach(tag => tagSet.add(tag));
    }
  });
  return Array.from(tagSet).sort();
};

