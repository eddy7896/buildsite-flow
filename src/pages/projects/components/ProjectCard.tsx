/**
 * Project Card Component
 * Individual project card for list view
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Calendar, Users, Eye, Edit, Trash2, MoreVertical, Clock, Calculator, Building2, ExternalLink } from "lucide-react";
import { Project } from '../utils/projectUtils';
import { getStatusColor, getStatusLabel } from '../utils/projectUtils';

interface ProjectCardProps {
  project: Project;
  onView: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onNavigateToEmployees?: (params: any) => void;
  onNavigateToAttendance?: (params: any) => void;
  onNavigateToPayroll?: (params: any) => void;
  onNavigateToDepartment?: (departmentId: string, departmentName?: string) => void;
  urlDepartmentId?: string | null;
  legacyDepartmentId?: string | null;
  displayDepartmentName?: string | null;
}

export const ProjectCard = ({
  project,
  onView,
  onEdit,
  onDelete,
  onNavigateToEmployees,
  onNavigateToAttendance,
  onNavigateToPayroll,
  onNavigateToDepartment,
  urlDepartmentId,
  legacyDepartmentId,
  displayDepartmentName,
}: ProjectCardProps) => {
  const hasTeamMembers = () => {
    if (!project.assigned_team) return false;
    try {
      const teamMembers = typeof project.assigned_team === 'string' 
        ? JSON.parse(project.assigned_team) 
        : project.assigned_team;
      return Array.isArray(teamMembers) && teamMembers.length > 0;
    } catch {
      return false;
    }
  };

  return (
    <Card key={project.id} className="hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-3 lg:flex-row lg:justify-between lg:items-start lg:space-y-0">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg lg:text-xl break-words">{project.name}</CardTitle>
            <CardDescription className="text-sm lg:text-base mt-1 break-words">{project.description}</CardDescription>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Badge variant={getStatusColor(project.status)} className="self-start">
              {getStatusLabel(project.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="w-full h-3 lg:h-2" />
          </div>
          
          {/* Project Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6 text-sm text-muted-foreground">
            {project.start_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Start: {new Date(project.start_date).toLocaleDateString()}</span>
              </div>
            )}
            {project.end_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Due: {new Date(project.end_date).toLocaleDateString()}</span>
              </div>
            )}
            {project.client && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {project.client.company_name || project.client.name}
                </span>
              </div>
            )}
          </div>
          
          {/* Budget and Actions */}
          <div className="flex flex-col space-y-3 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
            <div className="text-sm lg:text-base font-medium">
              Budget: ₹{(project.budget || 0).toLocaleString()}
            </div>
            <div className="flex flex-col space-y-2 lg:flex-row lg:gap-2 lg:space-y-0">
              <Button variant="outline" size="sm" onClick={() => onView(project)} className="w-full lg:w-auto h-9">
                <Eye className="h-4 w-4 mr-2 lg:mr-1" />
                View
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full lg:w-auto h-9">
                    <MoreVertical className="h-4 w-4 mr-2 lg:mr-1" />
                    More
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(project)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(project)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {hasTeamMembers() && (
                    <>
                      {onNavigateToEmployees && (
                        <DropdownMenuItem 
                          onClick={() => {
                            onNavigateToEmployees({ 
                              departmentId: urlDepartmentId || legacyDepartmentId || undefined,
                              departmentName: displayDepartmentName || undefined
                            });
                          }}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          View Team Members
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </DropdownMenuItem>
                      )}
                      {onNavigateToAttendance && (
                        <DropdownMenuItem 
                          onClick={() => {
                            onNavigateToAttendance({ 
                              projectId: project.id,
                              projectName: project.name,
                              departmentId: urlDepartmentId || legacyDepartmentId || undefined,
                              departmentName: displayDepartmentName || undefined
                            });
                          }}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          View Team Attendance
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </DropdownMenuItem>
                      )}
                      {onNavigateToPayroll && (
                        <DropdownMenuItem 
                          onClick={() => {
                            onNavigateToPayroll({ 
                              projectId: project.id,
                              projectName: project.name,
                              departmentId: urlDepartmentId || legacyDepartmentId || undefined,
                              departmentName: displayDepartmentName || undefined
                            });
                          }}
                        >
                          <Calculator className="h-4 w-4 mr-2" />
                          View Team Payroll
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  {displayDepartmentName && (urlDepartmentId || legacyDepartmentId) && onNavigateToDepartment && (
                    <DropdownMenuItem 
                      onClick={() => onNavigateToDepartment(urlDepartmentId || legacyDepartmentId || undefined, displayDepartmentName || undefined)}
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      View Department
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(project)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

