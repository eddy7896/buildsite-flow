import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Star,
  Loader2,
  FolderKanban
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Project } from "@/services/api/project-service";
import { statusColors, priorityColors, HealthScore } from "./types";

interface ProjectListViewProps {
  projects: Project[];
  loading: boolean;
  selectedProjectIds: Set<string>;
  favoriteProjects: Set<string>;
  deletingProjectId: string | null;
  searchTerm: string;
  selectedTags: string[];
  dateRange?: { from?: Date; to?: Date };
  onCreateProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onToggleSelection: (projectId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  calculateHealthScore: (project: Project) => HealthScore;
}

export function ProjectListView({
  projects,
  loading,
  selectedProjectIds,
  favoriteProjects,
  deletingProjectId,
  searchTerm,
  selectedTags,
  dateRange,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
  calculateHealthScore
}: ProjectListViewProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {selectedProjectIds.size > 0 && (
                  <th className="text-left p-4 w-12">
                    <Checkbox
                      checked={selectedProjectIds.size === projects.length && projects.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onSelectAll();
                        } else {
                          onClearSelection();
                        }
                      }}
                      aria-label="Select all projects"
                    />
                  </th>
                )}
                <th className="text-left p-4">Project</th>
                <th className="text-left p-4">Client</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Priority</th>
                <th className="text-left p-4">Progress</th>
                <th className="text-left p-4">Budget</th>
                <th className="text-left p-4">Health</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={selectedProjectIds.size > 0 ? 9 : 8} className="p-8">
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={selectedProjectIds.size > 0 ? 9 : 8} className="p-12">
                    <div className="text-center">
                      <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No projects found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm || selectedTags.length > 0 || dateRange
                          ? 'Try adjusting your filters'
                          : 'Create your first project to get started'}
                      </p>
                      {!searchTerm && selectedTags.length === 0 && !dateRange && (
                        <Button onClick={onCreateProject}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Project
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                projects.map((project) => {
                  const health = calculateHealthScore(project);
                  const isSelected = selectedProjectIds.has(project.id);
                  const isFavorite = favoriteProjects.has(project.id);
                  
                  return (
                    <tr 
                      key={project.id} 
                      className={cn(
                        "border-b hover:bg-muted/50 transition-colors",
                        isSelected && "bg-primary/5"
                      )}
                    >
                      {selectedProjectIds.size > 0 && (
                        <td className="p-4">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => onToggleSelection(project.id)}
                            aria-label={`Select ${project.name}`}
                          />
                        </td>
                      )}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{project.name}</p>
                              {isFavorite && (
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              )}
                            </div>
                            {project.project_code && (
                              <p className="text-sm text-muted-foreground">{project.project_code}</p>
                            )}
                          </div>
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
                                  {health.score}%
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Project Health Score</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/projects/${project.id}`)}
                                  aria-label={`View ${project.name}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEditProject(project)}
                                  aria-label={`Edit ${project.name}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDeleteProject(project)}
                                  disabled={deletingProjectId === project.id}
                                  aria-label={`Delete ${project.name}`}
                                >
                                  {deletingProjectId === project.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
