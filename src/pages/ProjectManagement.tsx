/**
 * Project Management Module
 * Enterprise-ready project management with Projects, Tasks, Resources, and Planning tabs
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import ProjectFormDialog from "@/components/ProjectFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProjectMetricsCards } from "@/components/project-management/fragments/ProjectMetricsCards";
import { ProjectAnalyticsCharts } from "@/components/project-management/fragments/ProjectAnalyticsCharts";
import { Project, Task } from "@/services/api/project-service";

// Hooks
import { useProjects } from "./project-management/hooks/useProjects";
import { useTasks } from "./project-management/hooks/useTasks";
import { useResources } from "./project-management/hooks/useResources";
import { useProjectFilters } from "./project-management/hooks/useProjectFilters";
import { useProjectActions } from "./project-management/hooks/useProjectActions";
import { useProjectMetrics } from "./project-management/hooks/useProjectMetrics";
import { useFavorites } from "./project-management/hooks/useFavorites";
import { useDragAndDrop } from "./project-management/hooks/useDragAndDrop";

// Components
import { ProjectsTab } from "./project-management/components/ProjectsTab";
import { TasksTab } from "./project-management/components/TasksTab";
import { ResourcesTab } from "./project-management/components/ResourcesTab";
import { PlanningTab } from "./project-management/components/PlanningTab";

// Utils
import { filterAndSortProjects, exportProjectsToCSV } from "./project-management/utils/projectUtils";

export default function ProjectManagement() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  // Tab state
  const [activeTab, setActiveTab] = useState("projects");
  const [loading, setLoading] = useState(true);
  
  // Project form state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  
  // View mode
  const [projectViewMode, setProjectViewMode] = useState<'grid' | 'list' | 'kanban' | 'gantt' | 'timeline'>('grid');
  const [planningViewMode, setPlanningViewMode] = useState<'gantt' | 'timeline' | 'critical-path'>('gantt');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  // Export state
  const [exporting, setExporting] = useState(false);
  
  // Filters
  const filters = useProjectFilters();
  
  // Data hooks
  const { projects, setProjects, fetchingProjects, fetchProjects } = useProjects(
    filters.statusFilter,
    filters.priorityFilter,
    filters.searchTerm
  );
  
  const { tasks } = useTasks('all', 'all', '');
  const { resources, fetchResources } = useResources();
  
  // Favorites
  const { favoriteProjects, toggleFavorite } = useFavorites();
  
  // Metrics
  const metrics = useProjectMetrics(projects);
  
  // Actions
  const projectActions = useProjectActions(projects, tasks, fetchProjects);
  
  // Drag and drop
  const dragAndDrop = useDragAndDrop(projects, setProjects, fetchProjects);
  
  // Filtered and sorted projects
  const filteredProjects = useMemo(() => {
    return filterAndSortProjects(
      projects,
      {
        statusFilter: filters.statusFilter,
        priorityFilter: filters.priorityFilter,
        searchTerm: filters.searchTerm,
        selectedTags: filters.selectedTags,
        dateRange: filters.dateRange,
        showArchived: filters.showArchived,
        deletingProjectId: projectActions.deletingProjectId,
      },
      {
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      },
      favoriteProjects
    );
  }, [
    projects,
    filters.statusFilter,
    filters.priorityFilter,
    filters.searchTerm,
    filters.selectedTags,
    filters.dateRange,
    filters.showArchived,
    filters.sortBy,
    filters.sortOrder,
    projectActions.deletingProjectId,
    favoriteProjects,
  ]);
  
  const totalPages = Math.ceil(filteredProjects.length / pageSize);
  
  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchProjects(),
          fetchResources()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load project management data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Auto-refresh projects tab
  useEffect(() => {
    if (activeTab === 'projects') {
      const interval = setInterval(() => {
        fetchProjects();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchProjects]);
  
  // Project form handlers
  const handleProjectSaved = useCallback(() => {
    fetchProjects();
    setShowProjectForm(false);
    setSelectedProject(null);
  }, [fetchProjects]);
  
  // Export handler
  const handleExportCSV = useCallback(() => {
    setExporting(true);
    try {
      exportProjectsToCSV(filteredProjects);
      toast({
        title: 'Success',
        description: `Exported ${filteredProjects.length} project(s) to CSV`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to export projects',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  }, [filteredProjects, toast]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search projects"]') as HTMLInputElement;
        searchInput?.focus();
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setSelectedProject(null);
        setShowProjectForm(true);
      }
      
      if (e.key === 'Escape') {
        if (showProjectForm) {
          setShowProjectForm(false);
          setSelectedProject(null);
        }
        if (projectActions.projectToDelete) {
          projectActions.setProjectToDelete(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showProjectForm, projectActions]);
  
  // Project action handlers
  const handleCreateProject = useCallback(() => {
    setSelectedProject(null);
    setShowProjectForm(true);
  }, []);
  
  const handleEditProject = useCallback((project: Project) => {
    setSelectedProject(project);
    setShowProjectForm(true);
  }, []);
  
  const handleSelectAllProjects = useCallback(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageProjects = filteredProjects.slice(startIndex, endIndex);
    projectActions.selectAllProjects(pageProjects.map(p => p.id));
  }, [currentPage, pageSize, filteredProjects, projectActions]);
  
  if (loading) {
    return (
      <ErrorBoundary>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Project Management</h1>
            <p className="text-muted-foreground">
              Enterprise project planning, tracking, and resource management
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={handleExportCSV}
              disabled={exporting || filteredProjects.length === 0}
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export ({filteredProjects.length})
                </>
              )}
            </Button>
            <Button onClick={handleCreateProject}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        <ProjectMetricsCards metrics={metrics} />

        <ProjectAnalyticsCharts projects={projects} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
            <ProjectsTab
              projects={projects}
              filteredProjects={filteredProjects}
              fetchingProjects={fetchingProjects}
              projectViewMode={projectViewMode}
              onViewModeChange={setProjectViewMode}
              filters={{
                statusFilter: filters.statusFilter,
                priorityFilter: filters.priorityFilter,
                searchTerm: filters.searchTerm,
                selectedTags: filters.selectedTags,
                dateRange: filters.dateRange,
                showArchived: filters.showArchived,
                deletingProjectId: projectActions.deletingProjectId,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder,
              }}
              favoriteProjects={favoriteProjects}
              selectedProjectIds={projectActions.selectedProjectIds}
              bulkActionOpen={projectActions.bulkActionOpen}
              draggedProjectId={dragAndDrop.draggedProjectId}
              pagination={{
                currentPage,
                pageSize,
                totalPages,
              }}
              onFiltersChange={{
                setStatusFilter: filters.setStatusFilter,
                setPriorityFilter: filters.setPriorityFilter,
                setSearchTerm: filters.setSearchTerm,
                toggleTag: filters.toggleTag,
                tagFilterOpen: filters.tagFilterOpen,
                setTagFilterOpen: filters.setTagFilterOpen,
                setDateRange: filters.setDateRange,
                handleSortChange: filters.handleSortChange,
                setShowArchived: filters.setShowArchived,
                setBulkActionOpen: projectActions.setBulkActionOpen,
                clearAllFilters: filters.clearAllFilters,
              }}
              savedViews={filters.savedViews}
              currentViewId={filters.currentViewId}
              onLoadSavedView={filters.loadSavedView}
              onSaveCurrentView={(toastFn) => filters.saveCurrentView(toastFn)}
              onProjectActions={{
                onCreateProject: handleCreateProject,
                onEditProject: handleEditProject,
                onDeleteProject: projectActions.setProjectToDelete,
                onDuplicateProject: projectActions.handleDuplicateProject,
                onArchiveProject: projectActions.handleArchiveProject,
                onToggleFavorite: toggleFavorite,
                onToggleSelection: projectActions.toggleProjectSelection,
                onSelectAll: handleSelectAllProjects,
                onClearSelection: projectActions.clearSelection,
                onBulkStatusChange: projectActions.handleBulkStatusChange,
                onBulkDelete: projectActions.handleBulkDelete,
              }}
              onDragAndDrop={{
                onDragStart: dragAndDrop.handleDragStart,
                onDragEnd: dragAndDrop.handleDragEnd,
                onDragOver: dragAndDrop.handleDragOver,
                onDrop: dragAndDrop.handleDrop,
              }}
              onPaginationChange={{
                setCurrentPage,
                setPageSize,
              }}
            />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <TasksTab />
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <ResourcesTab resources={resources} projects={projects} />
          </TabsContent>

          <TabsContent value="planning" className="space-y-4">
            <PlanningTab
              projects={projects}
              planningViewMode={planningViewMode}
              onPlanningViewModeChange={setPlanningViewMode}
            />
          </TabsContent>
        </Tabs>

        {showProjectForm && (
          <ProjectFormDialog
            isOpen={showProjectForm}
            onClose={() => {
              setShowProjectForm(false);
              setSelectedProject(null);
            }}
            project={selectedProject}
            onProjectSaved={handleProjectSaved}
          />
        )}

        {projectActions.projectToDelete && (
          <AlertDialog open={!!projectActions.projectToDelete} onOpenChange={() => projectActions.setProjectToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{projectActions.projectToDelete.name}"? This action cannot be undone.
                  {tasks.filter(t => t.project_id === projectActions.projectToDelete?.id).length > 0 && (
                    <span className="block mt-2 text-amber-600">
                      Warning: This project has {tasks.filter(t => t.project_id === projectActions.projectToDelete?.id).length} associated task(s).
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => projectActions.setProjectToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={projectActions.handleDeleteProject}
                  className="bg-destructive hover:bg-destructive/90"
                  disabled={projectActions.deletingProjectId === projectActions.projectToDelete?.id}
                >
                  {projectActions.deletingProjectId === projectActions.projectToDelete?.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </ErrorBoundary>
  );
}
