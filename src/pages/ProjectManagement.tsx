import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { GanttChart } from "@/components/project-management/GanttChart";
import { ResourceManagement } from "@/components/project-management/ResourceManagement";
import { ProjectTimeline } from "@/components/project-management/ProjectTimeline";
// import ProjectFormDialog from "@/components/ProjectFormDialog";

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  estimated_hours: number;
  actual_hours: number;
  budget: number;
  actual_cost: number;
  assigned_to: string;
  client_id: string;
  progress: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  clients?: {
    name: string;
    company_name: string;
  };
  profiles?: {
    full_name: string;
  };
}

interface Resource {
  id: string;
  name: string;
  role: string;
  hourly_rate: number;
  availability: number;
  current_projects: number;
  utilization: number;
}

const statusColors = {
  planning: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  on_hold: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

export default function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          clients(name, company_name),
          profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate progress for each project
      const projectsWithProgress = (data || []).map((project: any) => ({
        id: project.id,
        title: project.title,
        description: project.description || '',
        status: project.status,
        start_date: project.start_date,
        end_date: project.end_date,
        estimated_hours: project.estimated_hours || 0,
        actual_hours: project.actual_hours || 0,
        budget: project.budget || 0,
        actual_cost: project.actual_cost || 0,
        assigned_to: project.assigned_to || '',
        client_id: project.client_id || '',
        progress: calculateProjectProgress(project),
        priority: 'medium' as 'medium',
        clients: project.clients ? {
          name: project.clients.name || '',
          company_name: project.clients.company_name || ''
        } : undefined,
        profiles: project.profiles ? {
          full_name: project.profiles.full_name || ''
        } : undefined
      }));

      setProjects(projectsWithProgress);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
    }
  };

  const fetchResources = async () => {
    try {
      // Mock resource data - in real implementation, this would come from employee data
      const mockResources: Resource[] = [
        {
          id: '1',
          name: 'John Smith',
          role: 'Senior Developer',
          hourly_rate: 85,
          availability: 80,
          current_projects: 3,
          utilization: 90
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          role: 'Project Manager',
          hourly_rate: 75,
          availability: 100,
          current_projects: 5,
          utilization: 85
        },
        {
          id: '3',
          name: 'Mike Chen',
          role: 'Designer',
          hourly_rate: 65,
          availability: 60,
          current_projects: 2,
          utilization: 75
        },
        {
          id: '4',
          name: 'Emily Davis',
          role: 'Frontend Developer',
          hourly_rate: 70,
          availability: 90,
          current_projects: 2,
          utilization: 80
        }
      ];

      setResources(mockResources);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const calculateProjectProgress = (project: any) => {
    if (!project.estimated_hours || project.estimated_hours === 0) return 0;
    return Math.min((project.actual_hours / project.estimated_hours) * 100, 100);
  };

  const getProjectMetrics = () => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'in_progress').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const overBudgetProjects = projects.filter(p => p.actual_cost > p.budget).length;
    
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalActualCost = projects.reduce((sum, p) => sum + (p.actual_cost || 0), 0);
    const budgetVariance = ((totalActualCost - totalBudget) / totalBudget) * 100;

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
    const matchesFilter = filter === 'all' || project.status === filter;
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProjects(), fetchResources()]);
      setLoading(false);
    };
    loadData();
  }, []);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Management</h1>
          <p className="text-muted-foreground">
            Advanced project planning, tracking, and resource management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => {}}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => {
            toast({
              title: "Coming Soon",
              description: "Project creation form will be available soon"
            });
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

      {/* Filters and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Select value={viewMode} onValueChange={setViewMode}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grid View</SelectItem>
            <SelectItem value="gantt">Gantt Chart</SelectItem>
            <SelectItem value="timeline">Timeline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          {viewMode === 'grid' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <Badge className={statusColors[project.status as keyof typeof statusColors]}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardDescription>
                      {project.clients?.company_name || project.clients?.name}
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
                        <Label className="text-xs text-muted-foreground">Budget</Label>
                        <p className="font-medium">${project.budget?.toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Spent</Label>
                        <p className="font-medium">${project.actual_cost?.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{project.profiles?.full_name}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{project.actual_hours}h</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        className={priorityColors[(project.priority as keyof typeof priorityColors) || 'medium']}
                      >
                        {(project.priority || 'medium').toUpperCase()}
                      </Badge>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {viewMode === 'gantt' && (
            <Card>
              <CardHeader>
                <CardTitle>Gantt Chart</CardTitle>
                <CardDescription>Visual project timeline and dependencies</CardDescription>
              </CardHeader>
              <CardContent>
                <GanttChart projects={filteredProjects} />
              </CardContent>
            </Card>
          )}

          {viewMode === 'timeline' && (
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
                <CardDescription>Chronological view of project milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectTimeline projects={filteredProjects} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <ResourceManagement resources={resources} projects={projects} />
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Planning Tools</CardTitle>
              <CardDescription>Advanced planning and forecasting capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Advanced planning tools coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ProjectFormDialog will be added later */}
    </div>
  );
}