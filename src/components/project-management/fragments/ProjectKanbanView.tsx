import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Project } from "@/services/api/project-service";
import { priorityColors, HealthScore } from "./types";

interface ProjectKanbanViewProps {
  projects: Project[];
  filteredProjects: Project[];
  loading: boolean;
  currentPage: number;
  pageSize: number;
  draggedProjectId: string | null;
  onDragStart: (e: React.DragEvent, projectId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: string) => void;
  calculateHealthScore: (project: Project) => HealthScore;
}

const KANBAN_STATUSES = ['planning', 'active', 'in_progress', 'on_hold', 'completed'];

export function ProjectKanbanView({
  projects,
  filteredProjects,
  loading,
  currentPage,
  pageSize,
  draggedProjectId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  calculateHealthScore
}: ProjectKanbanViewProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-16 mt-2" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[1, 2, 3].map(j => (
                <Skeleton key={j} className="h-20 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {KANBAN_STATUSES.map((status) => {
        const statusProjects = filteredProjects.filter(p => p.status === status);
        const paginatedStatusProjects = statusProjects.slice(
          (currentPage - 1) * Math.ceil(pageSize / 5),
          currentPage * Math.ceil(pageSize / 5)
        );
        
        return (
          <Card 
            key={status}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, status)}
            className={cn(
              "transition-colors",
              draggedProjectId && "bg-muted/50"
            )}
          >
            <CardHeader>
              <CardTitle className="text-sm capitalize">{status.replace('_', ' ')}</CardTitle>
              <CardDescription>
                {statusProjects.length} project{statusProjects.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 min-h-[200px]">
              {paginatedStatusProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Drop projects here
                </div>
              ) : (
                paginatedStatusProjects.map((project) => {
                  const health = calculateHealthScore(project);
                  const isDragging = draggedProjectId === project.id;
                  
                  return (
                    <Card
                      key={project.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, project.id)}
                      onDragEnd={onDragEnd}
                      className={cn(
                        "p-3 cursor-move hover:shadow-md transition-all",
                        isDragging && "opacity-50"
                      )}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-sm flex-1">{project.name}</p>
                        <div className={cn(
                          "h-2 w-2 rounded-full ml-2 flex-shrink-0",
                          health.status === 'healthy' && "bg-green-500",
                          health.status === 'warning' && "bg-yellow-500",
                          health.status === 'critical' && "bg-red-500"
                        )} />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <Progress value={project.progress} className="h-1 flex-1 mr-2" />
                        <span className="text-xs text-muted-foreground">{Math.round(project.progress)}%</span>
                      </div>
                      {project.priority && (
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "mt-2 text-xs",
                            priorityColors[project.priority]
                          )}
                        >
                          {project.priority}
                        </Badge>
                      )}
                    </Card>
                  );
                })
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
