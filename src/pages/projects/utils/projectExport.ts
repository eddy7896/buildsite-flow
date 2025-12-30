/**
 * Project export utilities
 */

import { Project } from './projectUtils';
import { getStatusLabel } from './projectUtils';

/**
 * Export projects to CSV
 */
export const exportProjectsToCSV = (projects: Project[]) => {
  const headers = ['Project Name', 'Project Code', 'Client', 'Status', 'Priority', 'Progress (%)', 'Budget', 'Start Date', 'End Date', 'Project Manager'];
  const rows = projects.map(project => [
    project.name || '',
    project.project_code || '',
    project.client?.company_name || project.client?.name || 'No Client',
    getStatusLabel(project.status),
    project.priority || 'medium',
    project.progress || 0,
    project.budget || 0,
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

