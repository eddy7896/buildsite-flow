/**
 * Projects Tab Component
 */

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/services/api/project-service";
import { ProjectFiltersBar } from "@/components/project-management/fragments/ProjectFiltersBar";
import { ActiveFilterBadges } from "@/components/project-management/fragments/ActiveFilterBadges";
import { ProjectPagination } from "@/components/project-management/fragments/ProjectPagination";
import { ProjectGridView } from "@/components/project-management/fragments/ProjectGridView";
import { ProjectListView } from "@/components/project-management/fragments/ProjectListView";
import { ProjectKanbanView } from "@/components/project-management/fragments/ProjectKanbanView";
import { GanttChart } from "@/components/project-management/GanttChart";
import { ProjectTimeline } from "@/components/project-management/ProjectTimeline";
import { HealthScore } from "@/components/project-management/fragments/types";
import { filterAndSortProjects, extractAllTags, calculateHealthScore } from '../utils/projectUtils';

interface ProjectsTabProps {
  projects: Project[];
  filteredProjects: Project[];
  fetchingProjects: boolean;
  projectViewMode: 'grid' | 'list' | 'kanban' | 'gantt' | 'timeline';
  onViewModeChange: (mode: 'grid' | 'list' | 'kanban' | 'gantt' | 'timeline') => void;
  filters: {
    statusFilter: string;
    priorityFilter: string;
    searchTerm: string;
    selectedTags: string[];
    dateRange?: { from?: Date; to?: Date };
    showArchived: boolean;
    deletingProjectId: string | null;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  favoriteProjects: Set<string>;
  selectedProjectIds: Set<string>;
  bulkActionOpen: boolean;
  draggedProjectId: string | null;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
  };
  onFiltersChange: {
    setStatusFilter: (value: string) => void;
    setPriorityFilter: (value: string) => void;
    setSearchTerm: (value: string) => void;
    toggleTag: (tag: string) => void;
    tagFilterOpen: boolean;
    setTagFilterOpen: (open: boolean) => void;
    setDateRange: (range?: { from?: Date; to?: Date }) => void;
    handleSortChange: (value: string) => void;
    setShowArchived: (show: boolean) => void;
    setBulkActionOpen: (open: boolean) => void;
    clearAllFilters: () => void;
  };
  savedViews: any[];
  currentViewId: string | null;
  onLoadSavedView: (viewId: string) => void;
  onSaveCurrentView: (toast: any) => void;
  onProjectActions: {
    onCreateProject: () => void;
    onEditProject: (project: Project) => void;
    onDeleteProject: (project: Project) => void;
    onDuplicateProject: (project: Project) => void;
    onArchiveProject: (project: Project) => void;
    onToggleFavorite: (projectId: string) => void;
    onToggleSelection: (projectId: string) => void;
    onSelectAll: () => void;
    onClearSelection: () => void;
    onBulkStatusChange: (status: string) => void;
    onBulkDelete: () => void;
  };
  onDragAndDrop: {
    onDragStart: (e: React.DragEvent, projectId: string) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, newStatus: string) => void;
  };
  onPaginationChange: {
    setCurrentPage: (page: number) => void;
    setPageSize: (size: number) => void;
  };
}

export const ProjectsTab = ({
  projects,
  filteredProjects,
  fetchingProjects,
  projectViewMode,
  onViewModeChange,
  filters,
  favoriteProjects,
  selectedProjectIds,
  bulkActionOpen,
  draggedProjectId,
  pagination,
  onFiltersChange,
  savedViews,
  currentViewId,
  onLoadSavedView,
  onSaveCurrentView,
  onProjectActions,
  onDragAndDrop,
  onPaginationChange,
}: ProjectsTabProps) => {
  const allTags = useMemo(() => extractAllTags(projects), [projects]);
  
  const paginatedProjects = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, pagination.currentPage, pagination.pageSize]);

  return (
    <div className="space-y-4">
      <ProjectFiltersBar
        searchTerm={filters.searchTerm}
        onSearchChange={onFiltersChange.setSearchTerm}
        statusFilter={filters.statusFilter}
        onStatusFilterChange={onFiltersChange.setStatusFilter}
        priorityFilter={filters.priorityFilter}
        onPriorityFilterChange={onFiltersChange.setPriorityFilter}
        allTags={allTags}
        selectedTags={filters.selectedTags}
        onToggleTag={onFiltersChange.toggleTag}
        tagFilterOpen={onFiltersChange.tagFilterOpen}
        onTagFilterOpenChange={onFiltersChange.setTagFilterOpen}
        dateRange={filters.dateRange}
        onDateRangeChange={onFiltersChange.setDateRange}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSortChange={onFiltersChange.handleSortChange}
        savedViews={savedViews}
        currentViewId={currentViewId}
        onLoadSavedView={onLoadSavedView}
        onSaveCurrentView={onSaveCurrentView}
        onClearAllFilters={onFiltersChange.clearAllFilters}
        showArchived={filters.showArchived}
        onToggleArchived={() => onFiltersChange.setShowArchived(!filters.showArchived)}
        selectedProjectIds={selectedProjectIds}
        bulkActionOpen={bulkActionOpen}
        onBulkActionOpenChange={onFiltersChange.setBulkActionOpen}
        onBulkStatusChange={onProjectActions.onBulkStatusChange}
        onBulkDelete={onProjectActions.onBulkDelete}
        onClearSelection={onProjectActions.onClearSelection}
        viewMode={projectViewMode}
        onViewModeChange={onViewModeChange}
      />
      
      <ActiveFilterBadges
        selectedTags={filters.selectedTags}
        dateRange={filters.dateRange}
        onToggleTag={onFiltersChange.toggleTag}
        onClearDateRange={() => onFiltersChange.setDateRange(undefined)}
      />

      <ProjectPagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        totalItems={filteredProjects.length}
        onPageChange={onPaginationChange.setCurrentPage}
        onPageSizeChange={(size) => {
          onPaginationChange.setPageSize(size);
          onPaginationChange.setCurrentPage(1);
        }}
      />

      {projectViewMode === 'grid' && (
        <ProjectGridView
          projects={paginatedProjects}
          loading={fetchingProjects}
          selectedProjectIds={selectedProjectIds}
          favoriteProjects={favoriteProjects}
          deletingProjectId={filters.deletingProjectId}
          searchTerm={filters.searchTerm}
          selectedTags={filters.selectedTags}
          dateRange={filters.dateRange}
          showArchived={filters.showArchived}
          onCreateProject={onProjectActions.onCreateProject}
          onEditProject={onProjectActions.onEditProject}
          onDeleteProject={onProjectActions.onDeleteProject}
          onDuplicateProject={onProjectActions.onDuplicateProject}
          onArchiveProject={onProjectActions.onArchiveProject}
          onToggleFavorite={onProjectActions.onToggleFavorite}
          onToggleSelection={onProjectActions.onToggleSelection}
          onClearFilters={onFiltersChange.clearAllFilters}
          calculateHealthScore={calculateHealthScore}
        />
      )}

      {projectViewMode === 'list' && (
        <ProjectListView
          projects={paginatedProjects}
          loading={fetchingProjects}
          selectedProjectIds={selectedProjectIds}
          favoriteProjects={favoriteProjects}
          deletingProjectId={filters.deletingProjectId}
          searchTerm={filters.searchTerm}
          selectedTags={filters.selectedTags}
          dateRange={filters.dateRange}
          onCreateProject={onProjectActions.onCreateProject}
          onEditProject={onProjectActions.onEditProject}
          onDeleteProject={onProjectActions.onDeleteProject}
          onToggleSelection={onProjectActions.onToggleSelection}
          onSelectAll={onProjectActions.onSelectAll}
          onClearSelection={onProjectActions.onClearSelection}
          calculateHealthScore={calculateHealthScore}
        />
      )}

      {projectViewMode === 'gantt' && (
        <Card>
          <CardHeader>
            <CardTitle>Gantt Chart</CardTitle>
            <CardDescription>Visual project timeline and dependencies</CardDescription>
          </CardHeader>
          <CardContent>
            <GanttChart projects={paginatedProjects.map(p => ({
              id: p.id,
              title: p.name,
              start_date: p.start_date || new Date().toISOString(),
              end_date: p.end_date || new Date().toISOString(),
              status: p.status,
              progress: p.progress,
              clients: p.client ? { name: p.client.name } : undefined
            }))} />
          </CardContent>
        </Card>
      )}

      {projectViewMode === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle>Project Timeline</CardTitle>
            <CardDescription>Chronological view of project milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectTimeline projects={paginatedProjects.map(p => ({
              id: p.id,
              title: p.name,
              start_date: p.start_date || new Date().toISOString(),
              end_date: p.end_date || new Date().toISOString(),
              status: p.status,
              progress: p.progress,
              clients: p.client ? { name: p.client.name } : undefined,
              profiles: p.project_manager ? { full_name: p.project_manager.full_name } : undefined
            }))} />
          </CardContent>
        </Card>
      )}

      {projectViewMode === 'kanban' && (
        <ProjectKanbanView
          projects={projects}
          filteredProjects={filteredProjects}
          loading={fetchingProjects}
          currentPage={pagination.currentPage}
          pageSize={pagination.pageSize}
          draggedProjectId={draggedProjectId}
          onDragStart={onDragAndDrop.onDragStart}
          onDragEnd={onDragAndDrop.onDragEnd}
          onDragOver={onDragAndDrop.onDragOver}
          onDrop={onDragAndDrop.onDrop}
          calculateHealthScore={calculateHealthScore}
        />
      )}
    </div>
  );
};

