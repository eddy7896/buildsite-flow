/**
 * Project Management Module
 * Enterprise-ready project management with Projects, Tasks, Resources, and Planning tabs
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Calendar,
  Users,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Filter,
  Plus,
  Search,
  Download,
  Settings,
  Eye,
  Edit,
  Trash2,
  List,
  Grid3x3,
  Kanban,
  GanttChart as GanttChartIcon,
  Calendar as CalendarIcon,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import ProjectFormDialog from "@/components/ProjectFormDialog";
import { TaskKanbanBoard } from "@/components/TaskKanbanBoard";
import { GanttChart } from "@/components/project-management/GanttChart";
import { ResourceManagement } from "@/components/project-management/ResourceManagement";
import { ProjectTimeline } from "@/components/project-management/ProjectTimeline";
import { projectService, Project, Task } from "@/services/api/project-service";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { getEmployeesForAssignmentAuto } from "@/services/api/employee-selector-service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const statusColors: Record<string, string> = {
  planning: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  on_hold: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

export default function ProjectManagement() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("projects");
  
  // Projects tab state
  const [projectViewMode, setProjectViewMode] = useState<'grid' | 'list' | 'kanban' | 'gantt' | 'timeline'>('grid');
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('all');
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [projectPriorityFilter, setProjectPriorityFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  
  // Tasks tab state
  const [taskViewMode, setTaskViewMode] = useState<'kanban' | 'list' | 'timeline' | 'calendar'>('kanban');
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('all');
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [taskProjectFilter, setTaskProjectFilter] = useState<string>('all');
  
  // Resources tab state
  const [resources, setResources] = useState<any[]>([]);
  
  // Planning tab state
  const [planningViewMode, setPlanningViewMode] = useState<'gantt' | 'timeline' | 'critical-path'>('gantt');

  // Fetch all data
  useEffect(() => {
    loadData();
  }, []);

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

  const fetchProjects = async () => {
    try {
      const filters: any = {};
      if (projectStatusFilter !== 'all') {
        filters.status = [projectStatusFilter];
      }
      if (projectPriorityFilter !== 'all') {
        filters.priority = [projectPriorityFilter];
      }
      if (projectSearchTerm) {
        filters.search = projectSearchTerm;
      }
      
      const data = await projectService.getProjects(filters, profile, user?.id);
      setProjects(data);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load projects",
        variant: "destructive"
      });
    }
  };

  const fetchTasks = async () => {
    try {
      const filters: any = {};
      if (taskStatusFilter !== 'all') {
        filters.status = [taskStatusFilter];
      }
      if (taskProjectFilter !== 'all') {
        filters.project_id = taskProjectFilter;
      }
      if (taskSearchTerm) {
        filters.search = taskSearchTerm;
      }
      
      const data = await projectService.getTasks(filters, profile, user?.id);
      setTasks(data);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load tasks",
        variant: "destructive"
      });
    }
  };

  const fetchResources = async () => {
    try {
      const { selectRecords } = await import('@/services/api/postgresql-service');
      const { getAgencyId } = await import('@/utils/agencyUtils');
      const agencyId = await getAgencyId(profile, user?.id);
      
      if (!agencyId) return;
      
      // Use standardized employee fetching service
      const employeesData = await getEmployeesForAssignmentAuto(profile, user?.id);
      
      // Transform to format expected by ResourceManagement component
      const employees: any[] = employeesData.map(emp => ({
        user_id: emp.user_id,
        display_name: emp.full_name,
        full_name: emp.full_name,
        role: emp.role || 'employee',
        is_fully_active: emp.is_active
      }));
      
      // Fetch employee salary details for hourly rates
      // Note: employee_salary_details uses employee_id (from employee_details), not user_id
      // We need to get employee_details first to map user_id to employee_id
      const userIds = employees.map((e: any) => e.user_id).filter(Boolean);
      const salaryMap = new Map();
      
      if (userIds.length > 0) {
        try {
          // First get employee_details to map user_id to employee_id
          const employeeDetails = await selectRecords('employee_details', {
            where: { user_id: { operator: 'in', value: userIds }, agency_id: agencyId }
          });
          
          const employeeIds = employeeDetails.map((ed: any) => ed.id).filter(Boolean);
          
          if (employeeIds.length > 0) {
            // Now get salary details using employee_id
            const salaryDetails = await selectRecords('employee_salary_details', {
              where: { employee_id: { operator: 'in', value: employeeIds }, agency_id: agencyId },
              orderBy: 'effective_date DESC' // Get most recent salary
            });
            
            // Create a map from employee_id to salary details (get most recent per employee)
            const employeeIdToSalary = new Map();
            salaryDetails.forEach((s: any) => {
              if (!employeeIdToSalary.has(s.employee_id)) {
                employeeIdToSalary.set(s.employee_id, s);
              }
            });
            
            // Create a map from user_id to salary details
            employeeDetails.forEach((ed: any) => {
              const salary = employeeIdToSalary.get(ed.id);
              if (salary && ed.user_id) {
                salaryMap.set(ed.user_id, salary);
              }
            });
          }
        } catch (error) {
          console.warn('Could not fetch salary details:', error);
        }
      }
      
      // Fetch all tasks to calculate utilization
      const allTasks = await projectService.getTasks({}, profile, user?.id);
      const allProjects = await projectService.getProjects({}, profile, user?.id);
      
      // Calculate resource utilization from tasks and projects
      const resourceMap = new Map();
      
      employees.forEach((emp: any) => {
        const userTasks = allTasks.filter(t => 
          t.assignee_id === emp.user_id || 
          t.assignments?.some((a: any) => a.user_id === emp.user_id)
        );
        
        // Get projects where user is assigned (as project manager or in team)
        const userProjects = allProjects.filter(p => 
          p.project_manager_id === emp.user_id ||
          p.account_manager_id === emp.user_id ||
          (p.assigned_team && Array.isArray(p.assigned_team) && p.assigned_team.includes(emp.user_id))
        );
        
        // Calculate hours
        const totalActualHours = userTasks.reduce((sum, t) => sum + (Number(t.actual_hours) || 0), 0);
        const totalEstimatedHours = userTasks.reduce((sum, t) => sum + (Number(t.estimated_hours) || 0), 0);
        
        // Calculate utilization (based on estimated vs actual, or use a standard work week)
        // Standard: 40 hours/week = 160 hours/month
        const standardMonthlyHours = 160;
        const utilization = standardMonthlyHours > 0 
          ? Math.min((totalEstimatedHours / standardMonthlyHours) * 100, 100)
          : 0;
        
        // Get hourly rate from salary details
        const salary = salaryMap.get(emp.user_id);
        let hourlyRate = 0;
        if (salary) {
          if (salary.hourly_rate) {
            hourlyRate = Number(salary.hourly_rate);
          } else if (salary.salary || salary.base_salary) {
            const monthlySalary = Number(salary.salary || salary.base_salary || 0);
            // Convert monthly salary to hourly (assuming 160 hours/month)
            hourlyRate = monthlySalary > 0 ? monthlySalary / 160 : 0;
          }
        }
        
        // Calculate availability (100% - utilization, but at least 0%)
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
        description: "Failed to load resources",
        variant: "destructive"
      });
    }
  };

  const handleProjectSaved = () => {
    fetchProjects();
    setShowProjectForm(false);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      await projectService.deleteProject(projectToDelete.id, profile, user?.id);
      toast({
        title: "Success",
        description: "Project deleted successfully"
      });
      setProjectToDelete(null);
      fetchProjects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete project",
        variant: "destructive"
      });
    }
  };

  const getProjectMetrics = () => {
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
  };

  const filteredProjects = projects.filter(project => {
    if (projectStatusFilter !== 'all' && project.status !== projectStatusFilter) return false;
    if (projectPriorityFilter !== 'all' && project.priority !== projectPriorityFilter) return false;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const metrics = getProjectMetrics();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Management</h1>
          <p className="text-muted-foreground">
            Enterprise project planning, tracking, and resource management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => {
            toast({
              title: "Export",
              description: "Export functionality coming soon"
            });
          }}>
            <Download className="h-4 w-4 mr-2" />
            Export
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

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeProjects} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalProjects > 0 ? Math.round((metrics.completedProjects / metrics.totalProjects) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.completedProjects} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Performance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.budgetVariance > 0 ? '+' : ''}{metrics.budgetVariance.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              vs planned budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overBudgetProjects}</div>
            <p className="text-xs text-muted-foreground">
              over budget
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          {/* Filters and View Controls */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-2 flex-1 min-w-[300px]">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={projectSearchTerm}
                  onChange={(e) => {
                    setProjectSearchTerm(e.target.value);
                    fetchProjects();
                  }}
                  className="pl-8"
                />
              </div>
              <Select value={projectStatusFilter} onValueChange={(value) => {
                setProjectStatusFilter(value);
                fetchProjects();
              }}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={projectPriorityFilter} onValueChange={(value) => {
                setProjectPriorityFilter(value);
                fetchProjects();
              }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={projectViewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setProjectViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={projectViewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setProjectViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={projectViewMode === 'kanban' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setProjectViewMode('kanban')}
              >
                <Kanban className="h-4 w-4" />
              </Button>
              <Button
                variant={projectViewMode === 'gantt' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setProjectViewMode('gantt')}
              >
                <GanttChartIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={projectViewMode === 'timeline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setProjectViewMode('timeline')}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Projects View */}
          {projectViewMode === 'grid' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/projects/${project.id}`)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/${project.id}`);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(project);
                            setShowProjectForm(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToDelete(project);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription className="line-clamp-1">
                      {project.client?.company_name || project.client?.name || 'No client'}
                      {project.project_code && ` • ${project.project_code}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round(project.progress)}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="font-medium">{project.currency || 'USD'} {project.budget?.toLocaleString() || '0'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Spent</p>
                        <p className="font-medium">{project.currency || 'USD'} {project.actual_cost?.toLocaleString() || '0'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge className={statusColors[project.status] || statusColors.planning}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={priorityColors[project.priority] || priorityColors.medium}
                      >
                        {project.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredProjects.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No projects found. Create your first project to get started.
                </div>
              )}
            </div>
          )}

          {projectViewMode === 'list' && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Project</th>
                        <th className="text-left p-4">Client</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Priority</th>
                        <th className="text-left p-4">Progress</th>
                        <th className="text-left p-4">Budget</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjects.map((project) => (
                        <tr key={project.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{project.name}</p>
                              {project.project_code && (
                                <p className="text-sm text-muted-foreground">{project.project_code}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {project.client?.company_name || project.client?.name || '-'}
                          </td>
                          <td className="p-4">
                            <Badge className={statusColors[project.status] || statusColors.planning}>
                              {project.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className={priorityColors[project.priority] || priorityColors.medium}>
                              {project.priority}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <Progress value={project.progress} className="w-20 h-2" />
                              <span className="text-sm">{Math.round(project.progress)}%</span>
                            </div>
                          </td>
                          <td className="p-4">
                            {project.currency || 'USD'} {project.budget?.toLocaleString() || '0'}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/projects/${project.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedProject(project);
                                  setShowProjectForm(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setProjectToDelete(project)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredProjects.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      No projects found.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {projectViewMode === 'gantt' && (
            <Card>
              <CardHeader>
                <CardTitle>Gantt Chart</CardTitle>
                <CardDescription>Visual project timeline and dependencies</CardDescription>
              </CardHeader>
              <CardContent>
                <GanttChart projects={filteredProjects.map(p => ({
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
                <ProjectTimeline projects={filteredProjects.map(p => ({
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {['planning', 'active', 'in_progress', 'on_hold', 'completed'].map((status) => (
                  <Card key={status}>
                    <CardHeader>
                      <CardTitle className="text-sm capitalize">{status.replace('_', ' ')}</CardTitle>
                      <CardDescription>
                        {filteredProjects.filter(p => p.status === status).length} projects
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {filteredProjects
                        .filter(p => p.status === status)
                        .map((project) => (
                          <Card
                            key={project.id}
                            className="p-3 cursor-pointer hover:shadow-md"
                            onClick={() => navigate(`/projects/${project.id}`)}
                          >
                            <p className="font-medium text-sm">{project.name}</p>
                            <div className="flex items-center justify-between mt-2">
                              <Progress value={project.progress} className="h-1 flex-1 mr-2" />
                              <span className="text-xs text-muted-foreground">{Math.round(project.progress)}%</span>
                            </div>
                          </Card>
                        ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <TaskKanbanBoard />
        </TabsContent>

        {/* Resources Tab */}
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

        {/* Planning Tab */}
        <TabsContent value="planning" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant={planningViewMode === 'gantt' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPlanningViewMode('gantt')}
              >
                <GanttChartIcon className="h-4 w-4 mr-2" />
                Gantt Chart
              </Button>
              <Button
                variant={planningViewMode === 'timeline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPlanningViewMode('timeline')}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Timeline
              </Button>
              <Button
                variant={planningViewMode === 'critical-path' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPlanningViewMode('critical-path')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Critical Path
              </Button>
            </div>
          </div>

          {planningViewMode === 'gantt' && (
            <Card>
              <CardHeader>
                <CardTitle>Gantt Chart</CardTitle>
                <CardDescription>Interactive project planning and scheduling</CardDescription>
              </CardHeader>
              <CardContent>
                <GanttChart projects={projects.map(p => ({
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

          {planningViewMode === 'timeline' && (
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
                <CardDescription>Chronological view of all projects</CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectTimeline projects={projects.map(p => ({
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

          {planningViewMode === 'critical-path' && (
            <Card>
              <CardHeader>
                <CardTitle>Critical Path Analysis</CardTitle>
                <CardDescription>Identify critical tasks and dependencies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Critical path analysis coming soon...
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Project Form Dialog */}
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

      {/* Delete Confirmation */}
      {projectToDelete && (
        <DeleteConfirmDialog
          isOpen={!!projectToDelete}
          onClose={() => setProjectToDelete(null)}
          onConfirm={handleDeleteProject}
          title="Delete Project"
          description={`Are you sure you want to delete "${projectToDelete.name}"? This action cannot be undone.`}
        />
      )}
    </div>
  );
}
