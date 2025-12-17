/**
 * Project Details Page
 * Full project view with tasks, team, timeline, budget, and resources
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  FileText,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { projectService, Project, Task } from "@/services/api/project-service";
import ProjectFormDialog from "@/components/ProjectFormDialog";
import { TaskKanbanBoard } from "@/components/TaskKanbanBoard";
import { GanttChart } from "@/components/project-management/GanttChart";

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

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    if (id) {
      loadProject();
      loadTasks();
    }
  }, [id]);

  const loadProject = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await projectService.getProject(id, profile, user?.id);
      setProject(data);
    } catch (error: any) {
      console.error('Error loading project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load project",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    if (!id) return;
    
    try {
      const data = await projectService.getTasks({ project_id: id }, profile, user?.id);
      setTasks(data);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleProjectSaved = () => {
    loadProject();
    setShowEditForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Project not found</p>
            <Button onClick={() => navigate('/project-management')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: project.currency || 'USD'
    }).format(amount);
  };

  const budgetVariance = project.budget && project.actual_cost
    ? ((project.actual_cost - project.budget) / project.budget) * 100
    : 0;

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/project-management')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            {project.project_code && (
              <p className="text-muted-foreground">Code: {project.project_code}</p>
            )}
          </div>
        </div>
        <Button onClick={() => setShowEditForm(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Project
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(project.progress)}%</div>
            <Progress value={project.progress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(project.budget)}</div>
            <p className="text-xs text-muted-foreground">
              Spent: {formatCurrency(project.actual_cost)}
            </p>
            {budgetVariance !== 0 && (
              <p className={`text-xs ${budgetVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {budgetVariance > 0 ? '+' : ''}{budgetVariance.toFixed(1)}% variance
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}/{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(taskCompletionRate)}% complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={statusColors[project.status] || statusColors.planning}>
              {project.status.replace('_', ' ')}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Priority: {project.priority}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="mt-1">{project.description || 'No description provided'}</p>
                </div>
                {project.project_type && (
                  <div>
                    <p className="text-sm text-muted-foreground">Project Type</p>
                    <p className="mt-1">{project.project_type}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="mt-1">{formatDate(project.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="mt-1">{formatDate(project.end_date)}</p>
                  </div>
                </div>
                {project.deadline && (
                  <div>
                    <p className="text-sm text-muted-foreground">Deadline</p>
                    <p className="mt-1">{formatDate(project.deadline)}</p>
                  </div>
                )}
                {project.client && (
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="mt-1">{project.client.company_name || project.client.name}</p>
                  </div>
                )}
                {project.project_manager && (
                  <div>
                    <p className="text-sm text-muted-foreground">Project Manager</p>
                    <p className="mt-1">{project.project_manager.full_name}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold mt-1">{totalTasks}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed Tasks</p>
                  <p className="text-2xl font-bold mt-1">{completedTasks}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Team Members</p>
                  <p className="text-2xl font-bold mt-1">{project.assigned_team?.length || 0}</p>
                </div>
                {project.tags && project.tags.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <TaskKanbanBoard projectId={id} />
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              {project.assigned_team && project.assigned_team.length > 0 ? (
                <div className="space-y-2">
                  {project.assigned_team.map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded">
                      <span>{member}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No team members assigned</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <GanttChart projects={[{
                id: project.id,
                title: project.name,
                start_date: project.start_date || new Date().toISOString(),
                end_date: project.end_date || new Date().toISOString(),
                status: project.status,
                progress: project.progress,
                clients: project.client ? { name: project.client.name } : undefined
              }]} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Budget Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(project.budget)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Allocated Budget</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(project.allocated_budget)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Actual Cost</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(project.actual_cost)}</p>
                </div>
                {project.cost_center && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cost Center</p>
                    <p className="mt-1">{project.cost_center}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {project.budget && project.actual_cost ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Budget Utilization</span>
                        <span>{Math.min((project.actual_cost / project.budget) * 100, 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min((project.actual_cost / project.budget) * 100, 100)} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining Budget</p>
                      <p className={`text-2xl font-bold mt-1 ${(project.budget - project.actual_cost) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(project.budget - project.actual_cost)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Budget information not available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Form Dialog */}
      {showEditForm && (
        <ProjectFormDialog
          isOpen={showEditForm}
          onClose={() => setShowEditForm(false)}
          project={project}
          onProjectSaved={handleProjectSaved}
        />
      )}
    </div>
  );
}
