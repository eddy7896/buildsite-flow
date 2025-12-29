/**
 * Project Management Module
 * Enterprise-ready project management with Projects, Tasks, Resources, and Planning tabs
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import ProjectFormDialog from "@/components/ProjectFormDialog";
import { TaskKanbanBoard } from "@/components/TaskKanbanBoard";
import { GanttChart } from "@/components/project-management/GanttChart";
import { ResourceManagement } from "@/components/project-management/ResourceManagement";
import { ProjectTimeline } from "@/components/project-management/ProjectTimeline";
import { projectService, Project, Task } from "@/services/api/project-service";
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
import { getEmployeesForAssignmentAuto } from "@/services/api/employee-selector-service";
import { useDebounce } from "@/hooks/useDebounce";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DateRange } from "react-day-picker";
import { selectRecords } from '@/services/api/postgresql-service';
import { getAgencyId } from '@/utils/agencyUtils';

import {
  ProjectMetricsCards,
  ProjectAnalyticsCharts,
  ProjectFiltersBar,
  ProjectGridView,
  ProjectListView,
  ProjectKanbanView,
  ProjectPlanningTab,
  ProjectPagination,
  ActiveFilterBadges,
  ProjectMetrics,
  SavedView,
  HealthScore,
  Resource
} from "@/components/project-management/fragments";

export default function ProjectManagement() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("projects");
  
  const [projectViewMode, setProjectViewMode] = useState<'grid' | 'list' | 'kanban' | 'gantt' | 'timeline'>('grid');
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('all');
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [projectPriorityFilter, setProjectPriorityFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [fetchingProjects, setFetchingProjects] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalProjects, setTotalProjects] = useState(0);
  
  const [deletedProjects, setDeletedProjects] = useState<Array<{ project: Project; deletedAt: number }>>([]);
  const [exporting, setExporting] = useState(false);
  
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [favoriteProjects, setFavoriteProjects] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagFilterOpen, setTagFilterOpen] = useState(false);
  
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [currentViewId, setCurrentViewId] = useState<string | null>(null);
  
  const [showArchived, setShowArchived] = useState(false);
  
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('all');
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [taskProjectFilter, setTaskProjectFilter] = useState<string>('all');
  
  const [resources, setResources] = useState<Resource[]>([]);
  
  const [planningViewMode, setPlanningViewMode] = useState<'gantt' | 'timeline' | 'critical-path'>('gantt');
  
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);

  const debouncedProjectSearchTerm = useDebounce(projectSearchTerm, 300);
  const debouncedTaskSearchTerm = useDebounce(taskSearchTerm, 300);

  const projectsAbortControllerRef = useRef<AbortController | null>(null);
  const tasksAbortControllerRef = useRef<AbortController | null>(null);

  const fetchProjects = useCallback(async (abortSignal?: AbortSignal) => {
    try {
      setFetchingProjects(true);
      const filters: any = {};
      if (projectStatusFilter !== 'all') {
        filters.status = [projectStatusFilter];
      }
      if (projectPriorityFilter !== 'all') {
        filters.priority = [projectPriorityFilter];
      }
      if (debouncedProjectSearchTerm) {
        filters.search = debouncedProjectSearchTerm.trim().substring(0, 200);
      }
      
      const data = await projectService.getProjects(filters, profile, user?.id);
      
      if (abortSignal?.aborted) return;
      
      setProjects(data);
      setTotalProjects(data.length);
    } catch (error: any) {
      if (abortSignal?.aborted) return;
      
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setFetchingProjects(false);
    }
  }, [projectStatusFilter, projectPriorityFilter, debouncedProjectSearchTerm, profile, user?.id, toast]);

  const fetchTasks = useCallback(async (abortSignal?: AbortSignal) => {
    try {
      const filters: any = {};
      if (taskStatusFilter !== 'all') {
        filters.status = [taskStatusFilter];
      }
      if (taskProjectFilter !== 'all') {
        filters.project_id = taskProjectFilter;
      }
      if (debouncedTaskSearchTerm) {
        filters.search = debouncedTaskSearchTerm.trim().substring(0, 200);
      }
      
      const data = await projectService.getTasks(filters, profile, user?.id);
      
      if (abortSignal?.aborted) return;
      
      setTasks(data);
    } catch (error: any) {
      if (abortSignal?.aborted) return;
      
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load tasks",
        variant: "destructive"
      });
    }
  }, [taskStatusFilter, taskProjectFilter, debouncedTaskSearchTerm, profile, user?.id, toast]);

  useEffect(() => {
    if (projectsAbortControllerRef.current) {
      projectsAbortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    projectsAbortControllerRef.current = abortController;
    
    fetchProjects(abortController.signal);
    
    return () => {
      abortController.abort();
    };
  }, [fetchProjects]);

  useEffect(() => {
    if (tasksAbortControllerRef.current) {
      tasksAbortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    tasksAbortControllerRef.current = abortController;
    
    fetchTasks(abortController.signal);
    
    return () => {
      abortController.abort();
    };
  }, [fetchTasks]);

  useEffect(() => {
    if (activeTab === 'projects') {
      const interval = setInterval(() => {
        fetchProjects();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchProjects]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchProjects(),
          fetchTasks(),
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

  const fetchResources = useCallback(async () => {
    try {
      const agencyId = await getAgencyId(profile, user?.id);
      
      if (!agencyId) return;
      
      const employeesData = await getEmployeesForAssignmentAuto(profile, user?.id);
      
      const employees: any[] = employeesData.map(emp => ({
        user_id: emp.user_id,
        display_name: emp.full_name,
        full_name: emp.full_name,
        role: emp.role || 'employee',
        is_fully_active: emp.is_active
      }));
      
      const userIds = employees.map((e: any) => e.user_id).filter(Boolean);
      
      const [employeeDetails, allTasks, allProjects] = await Promise.all([
        userIds.length > 0 
          ? selectRecords('employee_details', {
              where: { user_id: { operator: 'in', value: userIds }, agency_id: agencyId }
            })
          : Promise.resolve([]),
        projectService.getTasks({}, profile, user?.id),
        projectService.getProjects({}, profile, user?.id)
      ]);
      
      const employeeIds = employeeDetails.map((ed: any) => ed.id).filter(Boolean);
      const salaryMap = new Map();
      
      if (employeeIds.length > 0) {
        try {
          const salaryDetails = await selectRecords('employee_salary_details', {
            where: { employee_id: { operator: 'in', value: employeeIds }, agency_id: agencyId },
            orderBy: 'effective_date DESC'
          });
          
          const employeeIdToSalary = new Map();
          salaryDetails.forEach((s: any) => {
            if (!employeeIdToSalary.has(s.employee_id)) {
              employeeIdToSalary.set(s.employee_id, s);
            }
          });
          
          employeeDetails.forEach((ed: any) => {
            const salary = employeeIdToSalary.get(ed.id);
            if (salary && ed.user_id) {
              salaryMap.set(ed.user_id, salary);
            }
          });
        } catch (error) {
          console.warn('Could not fetch salary details:', error);
        }
      }
      
      const resourceMap = new Map();
      
      employees.forEach((emp: any) => {
        const userTasks = allTasks.filter(t => 
          t.assignee_id === emp.user_id || 
          t.assignments?.some((a: any) => a.user_id === emp.user_id)
        );
        
        const userProjects = allProjects.filter(p => 
          p.project_manager_id === emp.user_id ||
          p.account_manager_id === emp.user_id ||
          (p.assigned_team && Array.isArray(p.assigned_team) && p.assigned_team.includes(emp.user_id))
        );
        
        const totalActualHours = userTasks.reduce((sum, t) => sum + (Number(t.actual_hours) || 0), 0);
        const totalEstimatedHours = userTasks.reduce((sum, t) => sum + (Number(t.estimated_hours) || 0), 0);
        
        const standardMonthlyHours = 160;
        const utilization = standardMonthlyHours > 0 
          ? Math.min((totalEstimatedHours / standardMonthlyHours) * 100, 100)
          : 0;
        
        const salary = salaryMap.get(emp.user_id);
        let hourlyRate = 0;
        if (salary) {
          if (salary.hourly_rate) {
            hourlyRate = Number(salary.hourly_rate);
          } else if (salary.salary || salary.base_salary) {
            const monthlySalary = Number(salary.salary || salary.base_salary || 0);
            hourlyRate = monthlySalary > 0 ? monthlySalary / 160 : 0;
          }
        }
        
        const availability = Math.max(100 - utilization, 0);
        
        resourceMap.set(emp.user_id, {
          id: emp.user_id,
          name: emp.display_name || emp.full_name || 'Unknown User',
          role: emp.role || emp.position || 'Employee',
          hourly_rate: hourlyRate,
          availability: Math.round(availability),
          current_projects: userProjects.length,
          utilization: Math.round(utilization),
          total_hours: totalActualHours,
          estimated_hours: totalEstimatedHours
        });
      });
      
      setResources(Array.from(resourceMap.values()));
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load resources",
        variant: "destructive"
      });
    }
  }, [profile, user?.id, toast]);

  const handleProjectSaved = useCallback(() => {
    fetchProjects();
    setShowProjectForm(false);
  }, [fetchProjects]);

  const handleDeleteProject = useCallback(async () => {
    if (!projectToDelete) return;
    
    const projectId = projectToDelete.id;
    const projectName = projectToDelete.name;
    const projectToRestore = { ...projectToDelete };
    
    const previousProjects = [...projects];
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setDeletingProjectId(projectId);
    setProjectToDelete(null);
    
    setDeletedProjects(prev => [...prev, { project: projectToRestore, deletedAt: Date.now() }]);
    
    setTimeout(() => {
      setDeletedProjects(prev => prev.filter(d => d.project.id !== projectId));
    }, 5000);
    
    try {
      const projectTasks = tasks.filter(t => t.project_id === projectId);
      if (projectTasks.length > 0) {
        const hasConfirmed = window.confirm(
          `This project has ${projectTasks.length} associated task(s). ` +
          `Deleting this project will remove the project reference from these tasks. Continue?`
        );
        if (!hasConfirmed) {
          setProjects(previousProjects);
          setDeletingProjectId(null);
          setDeletedProjects(prev => prev.filter(d => d.project.id !== projectId));
          return;
        }
      }
      
      await projectService.deleteProject(projectId, profile, user?.id);
      
      toast({
        title: "Success",
        description: `Project "${projectName}" deleted successfully`,
      });
      
      fetchProjects();
    } catch (error: any) {
      setProjects(previousProjects);
      setDeletingProjectId(null);
      setDeletedProjects(prev => prev.filter(d => d.project.id !== projectId));
      
      toast({
        title: "Error",
        description: error.message || "Failed to delete project. Please try again.",
        variant: "destructive"
      });
    }
  }, [projectToDelete, projects, tasks, profile, user?.id, fetchProjects, toast]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    projects.forEach(project => {
      if (project.tags && Array.isArray(project.tags)) {
        project.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      if (deletingProjectId === project.id) return false;
      
      if (!showArchived && project.status === 'archived') return false;
      if (showArchived && project.status !== 'archived') return false;
      
      if (projectStatusFilter !== 'all' && project.status !== projectStatusFilter) return false;
      
      if (projectPriorityFilter !== 'all' && project.priority !== projectPriorityFilter) return false;
      
      if (selectedTags.length > 0) {
        const projectTags = project.tags || [];
        if (!selectedTags.some(tag => projectTags.includes(tag))) return false;
      }
      
      if (dateRange?.from || dateRange?.to) {
        const projectStart = project.start_date ? new Date(project.start_date) : null;
        const projectEnd = project.end_date ? new Date(project.end_date) : null;
        
        if (dateRange.from && projectEnd && projectEnd < dateRange.from) return false;
        if (dateRange.to && projectStart && projectStart > dateRange.to) return false;
      }
      
      if (projectSearchTerm) {
        const searchLower = projectSearchTerm.toLowerCase();
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
      
      switch (sortBy) {
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
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    if (projectStatusFilter === 'favorites') {
      filtered.sort((a, b) => {
        const aFavorite = favoriteProjects.has(a.id);
        const bFavorite = favoriteProjects.has(b.id);
        if (aFavorite && !bFavorite) return -1;
        if (!aFavorite && bFavorite) return 1;
        return 0;
      });
    }
    
    return filtered;
  }, [
    projects, 
    projectStatusFilter, 
    projectPriorityFilter, 
    projectSearchTerm, 
    deletingProjectId,
    selectedTags,
    dateRange,
    showArchived,
    sortBy,
    sortOrder,
    favoriteProjects
  ]);

  const handleExportCSV = useCallback(() => {
    setExporting(true);
    try {
      const headers = ['Project Name', 'Project Code', 'Client', 'Status', 'Priority', 'Progress (%)', 'Budget', 'Actual Cost', 'Start Date', 'End Date', 'Project Manager'];
      const rows = filteredProjects.map(project => [
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
        if (projectToDelete) {
          setProjectToDelete(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showProjectForm, projectToDelete]);

  const getProjectMetrics = useCallback((): ProjectMetrics => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'in_progress').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const overBudgetProjects = projects.filter(p => {
      if (!p.budget || !p.actual_cost) return false;
      return p.actual_cost > p.budget;
    }).length;
    
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalActualCost = projects.reduce((sum, p) => sum + (p.actual_cost || 0), 0);
    const budgetVariance = totalBudget > 0 ? ((totalActualCost - totalBudget) / totalBudget) * 100 : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      overBudgetProjects,
      totalBudget,
      totalActualCost,
      budgetVariance
    };
  }, [projects]);

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredProjects.length / pageSize);

  useEffect(() => {
    const saved = localStorage.getItem('projectManagement_favorites');
    if (saved) {
      try {
        setFavoriteProjects(new Set(JSON.parse(saved)));
      } catch (e) {
        console.warn('Failed to load favorites:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (favoriteProjects.size > 0) {
      localStorage.setItem('projectManagement_favorites', JSON.stringify(Array.from(favoriteProjects)));
    }
  }, [favoriteProjects]);

  const toggleFavorite = useCallback((projectId: string) => {
    setFavoriteProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setProjectStatusFilter('all');
    setProjectPriorityFilter('all');
    setProjectSearchTerm('');
    setSelectedTags([]);
    setDateRange(undefined);
    setCurrentViewId(null);
  }, []);

  const saveCurrentView = useCallback(() => {
    const viewName = prompt('Enter a name for this view:');
    if (!viewName) return;
    
    const newView: SavedView = {
      id: Date.now().toString(),
      name: viewName,
      filters: {
        status: projectStatusFilter,
        priority: projectPriorityFilter,
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
  }, [projectStatusFilter, projectPriorityFilter, selectedTags, dateRange, toast]);

  const loadSavedView = useCallback((viewId: string) => {
    const view = savedViews.find(v => v.id === viewId);
    if (!view) return;
    
    setProjectStatusFilter(view.filters.status);
    setProjectPriorityFilter(view.filters.priority);
    setSelectedTags(view.filters.tags);
    setDateRange(view.filters.dateRange);
    setCurrentViewId(viewId);
  }, [savedViews]);

  const calculateHealthScore = useCallback((project: Project): HealthScore => {
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
  }, []);

  const handleArchiveProject = useCallback(async (project: Project) => {
    try {
      await projectService.updateProject(project.id, { status: 'archived' as any }, profile, user?.id);
      toast({
        title: 'Success',
        description: `Project "${project.name}" has been archived`,
      });
      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to archive project',
        variant: 'destructive'
      });
    }
  }, [profile, user?.id, fetchProjects, toast]);

  const handleDuplicateProject = useCallback(async (project: Project) => {
    try {
      const newProject = {
        ...project,
        name: `${project.name} (Copy)`,
        status: 'planning' as const,
        progress: 0,
        actual_cost: 0,
      };
      delete (newProject as any).id;
      delete (newProject as any).created_at;
      delete (newProject as any).updated_at;
      
      await projectService.createProject(newProject, profile, user?.id);
      toast({
        title: 'Success',
        description: `Project "${project.name}" duplicated successfully`,
      });
      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to duplicate project',
        variant: 'destructive'
      });
    }
  }, [profile, user?.id, fetchProjects, toast]);

  const handleBulkStatusChange = useCallback(async (newStatus: string) => {
    try {
      await Promise.all(
        Array.from(selectedProjectIds).map(projectId => 
          projectService.updateProject(projectId, { status: newStatus as any }, profile, user?.id)
        )
      );
      toast({
        title: 'Success',
        description: `${selectedProjectIds.size} project(s) updated`,
      });
      setSelectedProjectIds(new Set());
      setBulkActionOpen(false);
      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update projects',
        variant: 'destructive'
      });
    }
  }, [selectedProjectIds, profile, user?.id, fetchProjects, toast]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedProjectIds.size === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedProjectIds.size} project(s)? This action cannot be undone.`
    );
    if (!confirmed) return;
    
    try {
      await Promise.all(
        Array.from(selectedProjectIds).map(projectId => 
          projectService.deleteProject(projectId, profile, user?.id)
        )
      );
      toast({
        title: 'Success',
        description: `${selectedProjectIds.size} project(s) deleted`,
      });
      setSelectedProjectIds(new Set());
      setBulkActionOpen(false);
      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete projects',
        variant: 'destructive'
      });
    }
  }, [selectedProjectIds, profile, user?.id, fetchProjects, toast]);

  const toggleProjectSelection = useCallback((projectId: string) => {
    setSelectedProjectIds(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }, []);

  const selectAllProjects = useCallback(() => {
    setSelectedProjectIds(new Set(paginatedProjects.map(p => p.id)));
  }, [paginatedProjects]);

  const clearSelection = useCallback(() => {
    setSelectedProjectIds(new Set());
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, projectId: string) => {
    setDraggedProjectId(projectId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', projectId);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDraggedProjectId(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    e.stopPropagation();
    const projectId = e.dataTransfer.getData('text/plain');
    
    if (!projectId) return;
    
    const project = projects.find(p => p.id === projectId);
    if (!project || project.status === newStatus) {
      setDraggedProjectId(null);
      return;
    }
    
    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, status: newStatus as any } : p
    ));
    
    try {
      await projectService.updateProject(projectId, { status: newStatus as any }, profile, user?.id);
      toast({
        title: 'Success',
        description: `Project status updated to ${newStatus.replace('_', ' ')}`,
      });
      fetchProjects();
    } catch (error: any) {
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, status: project.status } : p
      ));
      toast({
        title: 'Error',
        description: error.message || 'Failed to update project status',
        variant: 'destructive'
      });
    } finally {
      setDraggedProjectId(null);
    }
  }, [projects, profile, user?.id, fetchProjects, toast]);

  const metrics = useMemo(() => getProjectMetrics(), [getProjectMetrics]);

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
            <Button onClick={() => {
              setSelectedProject(null);
              setShowProjectForm(true);
            }}>
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
            <ProjectFiltersBar
              searchTerm={projectSearchTerm}
              onSearchChange={setProjectSearchTerm}
              statusFilter={projectStatusFilter}
              onStatusFilterChange={setProjectStatusFilter}
              priorityFilter={projectPriorityFilter}
              onPriorityFilterChange={setProjectPriorityFilter}
              allTags={allTags}
              selectedTags={selectedTags}
              onToggleTag={toggleTag}
              tagFilterOpen={tagFilterOpen}
              onTagFilterOpenChange={setTagFilterOpen}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={(value) => {
                const [field, order] = value.split('_');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              savedViews={savedViews}
              currentViewId={currentViewId}
              onLoadSavedView={loadSavedView}
              onSaveCurrentView={saveCurrentView}
              onClearAllFilters={clearAllFilters}
              showArchived={showArchived}
              onToggleArchived={() => setShowArchived(!showArchived)}
              selectedProjectIds={selectedProjectIds}
              bulkActionOpen={bulkActionOpen}
              onBulkActionOpenChange={setBulkActionOpen}
              onBulkStatusChange={handleBulkStatusChange}
              onBulkDelete={handleBulkDelete}
              onClearSelection={clearSelection}
              viewMode={projectViewMode}
              onViewModeChange={setProjectViewMode}
            />
            
            <ActiveFilterBadges
              selectedTags={selectedTags}
              dateRange={dateRange}
              onToggleTag={toggleTag}
              onClearDateRange={() => setDateRange(undefined)}
            />

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

            {projectViewMode === 'grid' && (
              <ProjectGridView
                projects={paginatedProjects}
                loading={fetchingProjects}
                selectedProjectIds={selectedProjectIds}
                favoriteProjects={favoriteProjects}
                deletingProjectId={deletingProjectId}
                searchTerm={projectSearchTerm}
                selectedTags={selectedTags}
                dateRange={dateRange}
                showArchived={showArchived}
                onCreateProject={() => {
                  setSelectedProject(null);
                  setShowProjectForm(true);
                }}
                onEditProject={(project) => {
                  setSelectedProject(project);
                  setShowProjectForm(true);
                }}
                onDeleteProject={setProjectToDelete}
                onDuplicateProject={handleDuplicateProject}
                onArchiveProject={handleArchiveProject}
                onToggleFavorite={toggleFavorite}
                onToggleSelection={toggleProjectSelection}
                onClearFilters={clearAllFilters}
                calculateHealthScore={calculateHealthScore}
              />
            )}

            {projectViewMode === 'list' && (
              <ProjectListView
                projects={paginatedProjects}
                loading={fetchingProjects}
                selectedProjectIds={selectedProjectIds}
                favoriteProjects={favoriteProjects}
                deletingProjectId={deletingProjectId}
                searchTerm={projectSearchTerm}
                selectedTags={selectedTags}
                dateRange={dateRange}
                onCreateProject={() => {
                  setSelectedProject(null);
                  setShowProjectForm(true);
                }}
                onEditProject={(project) => {
                  setSelectedProject(project);
                  setShowProjectForm(true);
                }}
                onDeleteProject={setProjectToDelete}
                onToggleSelection={toggleProjectSelection}
                onSelectAll={selectAllProjects}
                onClearSelection={clearSelection}
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
                currentPage={currentPage}
                pageSize={pageSize}
                draggedProjectId={draggedProjectId}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                calculateHealthScore={calculateHealthScore}
              />
            )}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <TaskKanbanBoard />
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <ResourceManagement resources={resources} projects={projects.map(p => ({
              id: p.id,
              title: p.name,
              status: p.status,
              assigned_to: p.project_manager_id || '',
              estimated_hours: 0,
              actual_hours: 0
            }))} />
          </TabsContent>

          <TabsContent value="planning" className="space-y-4">
            <ProjectPlanningTab
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

        {projectToDelete && (
          <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{projectToDelete.name}"? This action cannot be undone.
                  {tasks.filter(t => t.project_id === projectToDelete.id).length > 0 && (
                    <span className="block mt-2 text-amber-600">
                      Warning: This project has {tasks.filter(t => t.project_id === projectToDelete.id).length} associated task(s).
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setProjectToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteProject}
                  className="bg-destructive hover:bg-destructive/90"
                  disabled={deletingProjectId === projectToDelete.id}
                >
                  {deletingProjectId === projectToDelete.id ? (
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
