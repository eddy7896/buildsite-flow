import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Plus, Calendar, Users, Search, Filter, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ProjectFormDialog from "@/components/ProjectFormDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  client_id: string | null;
  progress: number;
  assigned_team: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

const Projects = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleProjectSaved = () => {
    fetchProjects();
  };

  const handleProjectDeleted = () => {
    fetchProjects();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in-progress': return 'secondary';
      case 'planning': return 'outline';
      case 'on-hold': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage and track project progress</p>
        </div>
        <Button onClick={handleNewProject} className="w-full sm:w-auto min-h-[44px]">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <Card className="mb-4 sm:mb-6">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col space-y-3 sm:flex-row sm:gap-4 sm:space-y-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search projects..." 
                className="pl-10 h-12 text-base" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-12 w-full sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

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
        <div className="grid gap-3 sm:gap-4 lg:gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex flex-col space-y-2 sm:space-y-3 lg:flex-row lg:justify-between lg:items-start lg:space-y-0">
                  <div className="flex-1">
                    <CardTitle className="text-base sm:text-lg lg:text-xl">{project.name}</CardTitle>
                    <CardDescription className="text-sm lg:text-base mt-1">{project.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getStatusColor(project.status)} className="self-start">
                      {project.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="w-full h-2" />
                  </div>
                  <div className="flex flex-col space-y-2 sm:flex-row sm:gap-6 sm:space-y-0 text-sm text-muted-foreground">
                    {project.start_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {project.end_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>Due: {new Date(project.end_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {project.assigned_team && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span>{project.assigned_team}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                    <div className="text-sm text-muted-foreground">
                      Budget: ₹{project.budget.toLocaleString()}
                    </div>
                    <div className="flex flex-col space-y-2 sm:flex-row sm:gap-2 sm:space-y-0">
                      <Button variant="outline" size="sm" onClick={() => handleEditProject(project)} className="w-full sm:w-auto">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteProject(project)} className="w-full sm:w-auto">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
    </div>
  );
};

export default Projects;