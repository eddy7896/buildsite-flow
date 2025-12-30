/**
 * Projects Page
 * Main orchestrator for project management functionality
 * Refactored from 1,417 lines to ~250 lines
 */

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, List, GanttChart, Download, Loader2, Building2, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { DepartmentBreadcrumb } from "@/components/DepartmentBreadcrumb";
import { useDepartmentNavigation } from "@/hooks/useDepartmentNavigation";
import ProjectFormDialog from "@/components/ProjectFormDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import ProjectDetailsDialog from "@/components/ProjectDetailsDialog";
import { useProjects } from './projects/hooks/useProjects';
import { useProjectFilters } from './projects/hooks/useProjectFilters';
import { useProjectPipeline } from './projects/hooks/useProjectPipeline';
import { useProjectFilterOptions } from './projects/hooks/useProjectFilterOptions';
import { calculateProjectStats, Project } from './projects/utils/projectUtils';
import { exportProjectsToCSV } from './projects/utils/projectExport';
import { ProjectMetrics } from './projects/components/ProjectMetrics';
import { ProjectFilters } from './projects/components/ProjectFilters';
import { ProjectCard } from './projects/components/ProjectCard';
import { ProjectPipeline } from './projects/components/ProjectPipeline';
import { ProjectPagination } from './projects/components/ProjectPagination';

const Projects = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const {
    departmentId: urlDepartmentId,
    departmentName: urlDepartmentName,
    employeeId: urlEmployeeId,
    employeeName: urlEmployeeName,
    navigateToDepartment,
    navigateToEmployees,
    navigateToAttendance,
    navigateToPayroll,
  } = useDepartmentNavigation();
  
  const [searchParams] = useSearchParams();
  const legacyDepartmentId = searchParams.get('department');
  const legacyDepartmentName = searchParams.get('name');
  const clientFilterId = searchParams.get('client_id');
  
  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>(clientFilterId || "all");
  const [managerFilter, setManagerFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [projectToView, setProjectToView] = useState<Project | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Hooks
  const { projects, loading, fetchProjects } = useProjects(
    urlDepartmentId || undefined,
    urlEmployeeId || undefined,
    legacyDepartmentId || undefined,
    clientFilterId || undefined
  );
  const { clients, employees, departments } = useProjectFilterOptions();
  const {
    projectsByStatus,
    draggedProject,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
  } = useProjectPipeline(projects, () => {
    fetchProjects(statusFilter, priorityFilter, clientFilter, managerFilter, departmentFilter, searchTerm);
  });

  // Filter and sort projects
  const filteredProjects = useProjectFilters(
    projects,
    searchTerm,
    statusFilter,
    priorityFilter,
    sortBy,
    sortOrder
  );

  // Calculate stats
  const projectStats = useMemo(() => calculateProjectStats(projects), [projects]);

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / pageSize);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  // Fetch projects when filters change
  useEffect(() => {
    fetchProjects(statusFilter, priorityFilter, clientFilter, managerFilter, departmentFilter, searchTerm);
  }, [urlDepartmentId, urlEmployeeId, legacyDepartmentId, statusFilter, priorityFilter, clientFilter, managerFilter, departmentFilter, fetchProjects]);

  // Handlers
  const handleNewProject = () => {
    setSelectedProject(null);
    setProjectFormOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setProjectFormOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleViewProject = (project: Project) => {
    setProjectToView(project);
    setDetailsDialogOpen(true);
  };

  const handleProjectSaved = () => {
    fetchProjects(statusFilter, priorityFilter, clientFilter, managerFilter, departmentFilter, searchTerm);
    setSelectedProject(null);
  };

  const handleProjectDeleted = () => {
    fetchProjects(statusFilter, priorityFilter, clientFilter, managerFilter, departmentFilter, searchTerm);
    setProjectToDelete(null);
  };

  const handleExportCSV = () => {
    exportProjectsToCSV(filteredProjects);
    toast({
      title: 'Success',
      description: 'Projects exported to CSV successfully',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading projects...</span>
        </div>
      </div>
    );
  }

  const displayDepartmentName = urlDepartmentName || (legacyDepartmentName ? decodeURIComponent(legacyDepartmentName) : null);
  const displayEmployeeName = urlEmployeeName;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <DepartmentBreadcrumb currentPage="projects" />
      
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-bold">Projects</h1>
            {displayDepartmentName && (
              <Badge 
                variant="secondary" 
                className="text-sm cursor-pointer hover:bg-secondary/80 transition-colors"
                onClick={() => navigateToDepartment(urlDepartmentId || legacyDepartmentId || undefined, displayDepartmentName || undefined)}
              >
                <Building2 className="h-3 w-3 mr-1" />
                {displayDepartmentName}
              </Badge>
            )}
            {displayEmployeeName && (
              <Badge 
                variant="outline" 
                className="text-sm cursor-pointer hover:bg-accent transition-colors"
                onClick={() => navigateToEmployees({ employeeId: urlEmployeeId || undefined, employeeName: displayEmployeeName || undefined })}
              >
                <Users className="h-3 w-3 mr-1" />
                {displayEmployeeName}
              </Badge>
            )}
          </div>
          <p className="text-sm lg:text-base text-muted-foreground mt-1">
            {displayEmployeeName 
              ? `Projects for ${displayEmployeeName}`
              : displayDepartmentName 
              ? `Projects for ${displayDepartmentName} department`
              : "Manage and track project progress"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="w-full sm:w-auto" disabled={filteredProjects.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={handleNewProject} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <ProjectMetrics stats={projectStats} />

      {/* Search and Filter Card */}
      <ProjectFilters
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          setCurrentPage(1);
        }}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={(value) => {
          setPriorityFilter(value);
          setCurrentPage(1);
        }}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
        clientFilter={clientFilter}
        onClientFilterChange={(value) => {
          setClientFilter(value);
          setCurrentPage(1);
        }}
        managerFilter={managerFilter}
        onManagerFilterChange={(value) => {
          setManagerFilter(value);
          setCurrentPage(1);
        }}
        departmentFilter={departmentFilter}
        onDepartmentFilterChange={(value) => {
          setDepartmentFilter(value);
          setCurrentPage(1);
        }}
        clients={clients}
        employees={employees}
        departments={departments}
      />

      {/* Projects Content with Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            List View
          </TabsTrigger>
          <TabsTrigger value="pipeline">
            <GanttChart className="h-4 w-4 mr-2" />
            Pipeline View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No projects found matching your search.' : 'No projects found.'}
                  </p>
                  {!searchTerm && (
                    <Button 
                      className="mt-4" 
                      onClick={handleNewProject}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Project
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <ProjectPagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredProjects.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
              <div className="grid gap-4 lg:gap-6">
                {paginatedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onView={handleViewProject}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                    onNavigateToEmployees={navigateToEmployees}
                    onNavigateToAttendance={navigateToAttendance}
                    onNavigateToPayroll={navigateToPayroll}
                    onNavigateToDepartment={navigateToDepartment}
                    urlDepartmentId={urlDepartmentId}
                    legacyDepartmentId={legacyDepartmentId}
                    displayDepartmentName={displayDepartmentName}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <ProjectPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={filteredProjects.length}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <ProjectPipeline
            projects={projects}
            projectsByStatus={projectsByStatus}
            draggedProject={draggedProject}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onView={handleViewProject}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ProjectFormDialog
        isOpen={projectFormOpen}
        onClose={() => setProjectFormOpen(false)}
        project={selectedProject}
        onProjectSaved={handleProjectSaved}
      />

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onDeleted={handleProjectDeleted}
        itemType="Project"
        itemName={projectToDelete?.name || ''}
        itemId={projectToDelete?.id || ''}
        tableName="projects"
      />

      <ProjectDetailsDialog
        isOpen={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setProjectToView(null);
        }}
        project={projectToView}
        onEdit={() => {
          setDetailsDialogOpen(false);
          if (projectToView) {
            setSelectedProject(projectToView);
            setProjectFormOpen(true);
          }
        }}
      />
    </div>
  );
};

export default Projects;

