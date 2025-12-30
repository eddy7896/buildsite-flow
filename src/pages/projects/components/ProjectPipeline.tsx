/**
 * Project Pipeline/Kanban View Component
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar, Users, DollarSign, Eye, Edit, Trash2, GripVertical } from "lucide-react";
import { Project } from '../utils/projectUtils';
import { PIPELINE_STAGES, getStatusColor, getStatusLabel, getStatusBorderColor, formatCurrency } from '../utils/projectUtils';

interface ProjectPipelineProps {
  projects: Project[];
  projectsByStatus: Record<string, Project[]>;
  draggedProject: string | null;
  searchTerm: string;
  statusFilter: string;
  priorityFilter: string;
  onDragStart: (e: React.DragEvent, projectId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, newStatus: string) => void;
  onView: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export const ProjectPipeline = ({
  projects,
  projectsByStatus,
  draggedProject,
  searchTerm,
  statusFilter,
  priorityFilter,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onView,
  onEdit,
  onDelete,
}: ProjectPipelineProps) => {
  const filterProject = (project: Project) => {
    const matchesSearch = !searchTerm ||
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.project_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const normalizedStatus = project.status === 'in_progress' ? 'in-progress' : 
                             project.status === 'on_hold' ? 'on-hold' : project.status;
    const matchesStatus = statusFilter === 'all' || normalizedStatus === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Project Pipeline</CardTitle>
        <CardDescription className="text-base">
          Visual representation of projects through different stages. Drag and drop projects to change their status.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 lg:p-6">
        <div className="flex gap-4 lg:gap-5 xl:gap-6 overflow-x-auto pb-4 -mx-4 lg:-mx-6 px-4 lg:px-6 scrollbar-thin">
          {PIPELINE_STAGES.map((stage) => {
            const stageProjects = (projectsByStatus[stage.status] || []).filter(filterProject);
            const stageBudget = stageProjects.reduce((sum, project) => {
              const budget = typeof project.budget === 'number' ? project.budget : 
                            typeof project.budget === 'string' ? parseFloat(project.budget) || 0 : 0;
              return sum + budget;
            }, 0);
            const avgProgress = stageProjects.length > 0
              ? Math.round(stageProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / stageProjects.length)
              : 0;
            
            return (
              <div 
                key={stage.status} 
                className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px] lg:w-[340px] xl:w-[360px] 2xl:w-[380px]"
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, stage.status)}
              >
                <div className="pipeline-column bg-card rounded-lg p-4 lg:p-5 h-[calc(100vh-300px)] min-h-[650px] sm:min-h-[700px] lg:min-h-[750px] max-h-[850px] border border-border flex flex-col shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                  {/* Stage Header */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-2.5 lg:gap-3">
                      <span className="text-xl lg:text-2xl">{stage.icon}</span>
                      <h3 className="font-semibold text-sm lg:text-base text-foreground">{stage.name}</h3>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="bg-white text-gray-800 font-bold text-xs lg:text-sm px-2.5 lg:px-3 py-1 shadow-sm"
                    >
                      {stageProjects.length}
                    </Badge>
                  </div>

                  {/* Stage Statistics */}
                  <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 bg-white/60 rounded-lg p-2.5 lg:p-3 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs lg:text-sm font-medium text-gray-600">Total Budget</span>
                      <span className="font-bold text-xs lg:text-sm text-gray-900">
                        {formatCurrency(stageBudget)}
                      </span>
                    </div>
                    {stageProjects.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs lg:text-sm font-medium text-gray-600">Avg Progress</span>
                          <span className="font-bold text-xs lg:text-sm text-gray-900">{avgProgress}%</span>
                        </div>
                        <Progress value={avgProgress} className="h-2" />
                      </div>
                    )}
                  </div>

                  {/* Projects List */}
                  <div className="space-y-3 flex-1 overflow-y-auto min-h-[350px] scrollbar-thin">
                    {stageProjects.length === 0 ? (
                      <div className="text-center py-12 lg:py-16 text-muted-foreground border-2 border-dashed border-gray-300 rounded-xl bg-white/60 backdrop-blur-sm">
                        <div className="text-3xl lg:text-4xl mb-2 lg:mb-3 opacity-40">📋</div>
                        <div className="text-xs lg:text-sm font-medium">Drop projects here</div>
                        <div className="text-[10px] lg:text-xs mt-1 opacity-70">Drag a project card to move it</div>
                      </div>
                    ) : (
                      stageProjects.map((project) => {
                        const isDragging = draggedProject === project.id;
                        const projectBudget = typeof project.budget === 'number' ? project.budget : 
                                            typeof project.budget === 'string' ? parseFloat(project.budget) || 0 : 0;
                        
                        return (
                          <Card 
                            key={project.id} 
                            draggable
                            onDragStart={(e) => onDragStart(e, project.id)}
                            onDragEnd={onDragEnd}
                            onClick={() => onView(project)}
                            className={`relative p-3 lg:p-4 hover:shadow-xl cursor-pointer bg-white border-2 border-gray-200 border-l-4 ${getStatusBorderColor(project.status)} hover:border-blue-300 hover:shadow-2xl group ${
                              isDragging ? 'opacity-40 scale-95 rotate-2' : 'hover:scale-[1.02] hover:-translate-y-1'
                            }`}
                          >
                            <div className="space-y-2.5 lg:space-y-3">
                              {/* Status Badge and Drag Handle */}
                              <div className="flex items-center justify-between">
                                <Badge 
                                  variant={getStatusColor(project.status)} 
                                  className="text-[9px] lg:text-[10px] px-1.5 lg:px-2 py-0.5 font-semibold"
                                >
                                  {getStatusLabel(project.status)}
                                </Badge>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" onMouseDown={(e) => e.stopPropagation()}>
                                  <GripVertical className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-gray-400" />
                                </div>
                              </div>
                              
                              {/* Project Name */}
                              <div className="font-bold text-xs lg:text-sm text-gray-900 line-clamp-2 min-h-[2.25rem] lg:min-h-[2.5rem] cursor-pointer hover:text-blue-600 transition-colors" title={project.name}>
                                {project.name}
                              </div>
                              
                              {/* Client Info */}
                              {project.client && (
                                <div className="flex items-center gap-1.5 lg:gap-2 text-[10px] lg:text-xs text-gray-600 bg-gray-50 rounded-md px-2 py-1 lg:py-1.5">
                                  <Users className="h-3 w-3 lg:h-3.5 lg:w-3.5 flex-shrink-0 text-blue-600" />
                                  <span className="truncate font-medium">
                                    {project.client.company_name || project.client.name}
                                  </span>
                                </div>
                              )}

                              {/* Budget */}
                              {projectBudget > 0 && (
                                <div className="flex items-center gap-1.5 lg:gap-2 text-xs lg:text-sm font-bold text-gray-900 bg-green-50 rounded-md px-2 py-1 lg:py-1.5">
                                  <DollarSign className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-green-600 flex-shrink-0" />
                                  <span className="truncate">{formatCurrency(projectBudget)}</span>
                                </div>
                              )}

                              {/* Progress */}
                              <div className="space-y-1.5 lg:space-y-2 bg-gray-50 rounded-md p-2 lg:p-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] lg:text-xs font-medium text-gray-600">Progress</span>
                                  <span className="font-bold text-xs lg:text-sm text-gray-900">{project.progress || 0}%</span>
                                </div>
                                <Progress value={project.progress || 0} className="h-1.5 lg:h-2" />
                              </div>

                              {/* Dates */}
                              {(project.start_date || project.end_date) && (
                                <div className="flex items-center gap-1.5 lg:gap-2 text-[10px] lg:text-xs text-gray-600 bg-blue-50 rounded-md px-2 py-1 lg:py-1.5">
                                  <Calendar className="h-3 w-3 lg:h-3.5 lg:w-3.5 flex-shrink-0 text-blue-600" />
                                  <span className="truncate font-medium">
                                    {project.start_date && new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    {project.start_date && project.end_date && ' → '}
                                    {project.end_date && new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              )}

                              {/* Quick Actions */}
                              <div className="flex items-center gap-1 lg:gap-1.5 pt-2 border-t border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 lg:h-7 px-2 lg:px-2.5 text-[10px] lg:text-xs flex-1 hover:bg-blue-50 hover:text-blue-700 rounded-md"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onView(project);
                                  }}
                                >
                                  <Eye className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 lg:h-7 px-2 lg:px-2.5 text-[10px] lg:text-xs flex-1 hover:bg-green-50 hover:text-green-700 rounded-md"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(project);
                                  }}
                                >
                                  <Edit className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 lg:h-7 px-2 lg:px-2.5 text-[10px] lg:text-xs hover:bg-red-50 hover:text-red-700 rounded-md"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(project);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

