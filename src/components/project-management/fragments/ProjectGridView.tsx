import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Star,
  Archive,
  Copy,
  Settings,
  Loader2,
  FolderKanban,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Project } from "@/services/api/project-service";
import { statusColors, priorityColors, HealthScore } from "./types";

interface ProjectGridViewProps {
  projects: Project[];
  loading: boolean;
  selectedProjectIds: Set<string>;
  favoriteProjects: Set<string>;
  deletingProjectId: string | null;
  searchTerm: string;
  selectedTags: string[];
  dateRange?: { from?: Date; to?: Date };
  showArchived: boolean;
  onCreateProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onDuplicateProject: (project: Project) => void;
  onArchiveProject: (project: Project) => void;
  onToggleFavorite: (projectId: string) => void;
  onToggleSelection: (projectId: string) => void;
  onClearFilters: () => void;
  calculateHealthScore: (project: Project) => HealthScore;
}

export function ProjectGridView({
  projects,
  loading,
  selectedProjectIds,
  favoriteProjects,
  deletingProjectId,
  searchTerm,
  selectedTags,
  dateRange,
  showArchived,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onDuplicateProject,
  onArchiveProject,
  onToggleFavorite,
  onToggleSelection,
  onClearFilters,
  calculateHealthScore
}: ProjectGridViewProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-2 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FolderKanban className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm || selectedTags.length > 0 || dateRange
              ? 'No projects found'
              : showArchived
              ? 'No archived projects'
              : 'No projects yet'}
          </h3>
          <p className="text-muted-foreground mb-4 text-center max-w-md">
            {searchTerm || selectedTags.length > 0 || dateRange
              ? 'Try adjusting your filters to see more projects.'
              : showArchived
              ? 'You don\'t have any archived projects yet.'
              : 'Get started by creating your first project to organize and track your work.'}
          </p>
          {!searchTerm && selectedTags.length === 0 && !dateRange && !showArchived && (
            <Button onClick={onCreateProject}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Project
            </Button>
          )}
          {(searchTerm || selectedTags.length > 0 || dateRange) && (
            <Button variant="outline" onClick={onClearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
        const health = calculateHealthScore(project);
        const isFavorite = favoriteProjects.has(project.id);
        const isSelected = selectedProjectIds.has(project.id);
        
        return (
          <Card 
            key={project.id} 
            className={cn(
              "hover:shadow-md transition-shadow cursor-pointer relative",
              isSelected && "ring-2 ring-primary",
              health.status === 'critical' && "border-l-4 border-l-red-500",
              health.status === 'warning' && "border-l-4 border-l-yellow-500"
            )}
            onClick={() => {
              if (selectedProjectIds.size > 0) {
                onToggleSelection(project.id);
              } else {
                navigate(`/projects/${project.id}`);
              }
            }}
          >
            {selectedProjectIds.size > 0 && (
              <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelection(project.id)}
                  aria-label={`Select ${project.name}`}
                />
              </div>
            )}
            
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <CardTitle className="text-lg line-clamp-1 flex-1">{project.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(project.id);
                    }}
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={cn(
                      "h-4 w-4",
                      isFavorite && "fill-yellow-400 text-yellow-400"
                    )} />
                  </Button>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      aria-label="Project options"
                      disabled={deletingProjectId === project.id}
                    >
                      {deletingProjectId === project.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Settings className="h-4 w-4" />
                      )}
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
                      onEditProject(project);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateProject(project);
                    }}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    {project.status !== 'archived' && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onArchiveProject(project);
                      }}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project);
                      }}
                      disabled={deletingProjectId === project.id}
                    >
                      {deletingProjectId === project.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
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
              <div className="flex items-center justify-between">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          health.status === 'healthy' && "bg-green-500",
                          health.status === 'warning' && "bg-yellow-500",
                          health.status === 'critical' && "bg-red-500"
                        )} />
                        <span className="text-xs text-muted-foreground">
                          Health: {health.score}%
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Project health score based on budget, timeline, and progress</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
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
        );
      })}
    </div>
  );
}
