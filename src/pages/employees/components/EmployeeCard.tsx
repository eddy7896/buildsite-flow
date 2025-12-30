/**
 * Employee Card Component
 * Individual employee card display
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Mail, Phone, MapPin, Calendar, Edit, Eye, MoreVertical, 
  Building2, Briefcase, Clock, Calculator, BarChart3, Trash2, ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getRoleIcon, getRoleBadgeVariant, getEmploymentTypeLabel, getInitials } from '../utils/employeeUtils';
import { getRoleDisplayName } from '@/utils/roleUtils';
import { UnifiedEmployee } from '../hooks/useEmployees';

interface EmployeeCardProps {
  employee: UnifiedEmployee;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onView: (employee: UnifiedEmployee) => void;
  onEdit: (employee: UnifiedEmployee) => void;
  onDelete: (employee: UnifiedEmployee) => void;
  onNavigateToDepartment: (departmentId: string, departmentName?: string) => void;
  onNavigateToProjects: (params: { employeeId: string; employeeName: string; departmentId?: string; departmentName?: string }) => void;
  onNavigateToAttendance: (params: { employeeId: string; employeeName: string; departmentId?: string; departmentName?: string }) => void;
  onNavigateToPayroll: (params: { employeeId: string; employeeName: string; departmentId?: string; departmentName?: string }) => void;
}

export const EmployeeCard = ({
  employee,
  canView,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
  onNavigateToDepartment,
  onNavigateToProjects,
  onNavigateToAttendance,
  onNavigateToPayroll,
}: EmployeeCardProps) => {
  const navigate = useNavigate();
  const RoleIcon = getRoleIcon(employee.role);

  return (
    <Card 
      className="hover:shadow-lg border-l-4 border-l-primary/20 flex flex-col h-full w-full"
    >
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-start space-x-3">
          <Avatar className="h-14 w-14 border-2 border-primary/20 flex-shrink-0">
            <AvatarImage 
              src={employee.avatar_url && employee.avatar_url.startsWith('data:') 
                ? employee.avatar_url 
                : employee.avatar_url || undefined} 
              alt={employee.full_name} 
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {getInitials(employee.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-5 truncate mb-1.5">
              {employee.full_name}
            </CardTitle>
            <div className="flex items-center space-x-2 mb-1.5">
              <RoleIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <Badge variant={getRoleBadgeVariant(employee.role)} className="text-xs px-1.5 py-0">
                {getRoleDisplayName(employee.role as any)}
              </Badge>
            </div>
            {employee.position ? (
              <p className="text-xs text-muted-foreground truncate">
                {employee.position}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground/50 italic">No position</p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-3 pb-4">
        <div className="space-y-1.5 text-sm flex-1 min-h-[80px]">
          {employee.email ? (
            <div className="flex items-start space-x-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span className="truncate text-xs leading-relaxed">{employee.email}</span>
            </div>
          ) : (
            <div className="flex items-start space-x-2 text-muted-foreground/50">
              <Mail className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span className="text-xs italic">No email</span>
            </div>
          )}
          
          {employee.phone ? (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-xs">{employee.phone}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-muted-foreground/50">
              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-xs italic">No phone</span>
            </div>
          )}
          
          {employee.work_location ? (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate text-xs">{employee.work_location}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-muted-foreground/50">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-xs italic">No location</span>
            </div>
          )}
          
          {employee.hire_date ? (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-xs">
                Joined {new Date(employee.hire_date).toLocaleDateString()}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-muted-foreground/50">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-xs italic">No hire date</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t space-y-2 flex-shrink-0">
          <div className="flex flex-wrap gap-1.5 min-h-[24px]">
            {employee.department && employee.department_id ? (
              <Badge 
                variant="outline" 
                className="text-xs px-2 py-0.5 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => onNavigateToDepartment(employee.department_id!, employee.department || undefined)}
              >
                {employee.department}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs px-2 py-0.5 opacity-50">
                No dept
              </Badge>
            )}
            {employee.employment_type && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {getEmploymentTypeLabel(employee.employment_type)}
              </Badge>
            )}
            <Badge 
              variant={employee.is_active ? 'default' : 'destructive'} 
              className="text-xs px-2 py-0.5"
            >
              {employee.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          {employee.employee_id ? (
            <p className="text-xs text-muted-foreground font-mono truncate">
              ID: {employee.employee_id}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/50 italic">
              No employee ID
            </p>
          )}
        </div>

        <div className="flex gap-1.5 sm:gap-2 pt-2 border-t flex-shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs h-8 min-w-0"
            onClick={() => onView(employee)}
            disabled={!canView}
          >
            <Eye className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
            <span className="hidden sm:inline">View</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 sm:w-8 p-0 flex-shrink-0"
            onClick={() => onEdit(employee)}
            disabled={!canEdit}
            title="Edit employee"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 flex-shrink-0"
                title="More actions"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(employee)} disabled={!canView}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(employee)} disabled={!canEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {employee.department_id && (
                <DropdownMenuItem 
                  onClick={() => onNavigateToDepartment(employee.department_id!, employee.department || undefined)}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  View Department
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onNavigateToProjects({ 
                  employeeId: employee.user_id, 
                  employeeName: employee.full_name,
                  departmentId: employee.department_id,
                  departmentName: employee.department || undefined
                })}
              >
                <Briefcase className="h-4 w-4 mr-2" />
                View Projects
                <ExternalLink className="h-3 w-3 ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onNavigateToAttendance({ 
                  employeeId: employee.user_id, 
                  employeeName: employee.full_name,
                  departmentId: employee.department_id,
                  departmentName: employee.department || undefined
                })}
              >
                <Clock className="h-4 w-4 mr-2" />
                View Attendance
                <ExternalLink className="h-3 w-3 ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate(`/employee-performance?employeeId=${employee.user_id}`)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Performance
                <ExternalLink className="h-3 w-3 ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onNavigateToPayroll({ 
                  employeeId: employee.user_id, 
                  employeeName: employee.full_name,
                  departmentId: employee.department_id,
                  departmentName: employee.department || undefined
                })}
              >
                <Calculator className="h-4 w-4 mr-2" />
                View Payroll
                <ExternalLink className="h-3 w-3 ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(employee)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

