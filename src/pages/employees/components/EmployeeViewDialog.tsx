/**
 * Employee View Dialog Component
 * Displays detailed employee information
 */

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Building2, Briefcase, Clock, Calculator, BarChart3, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getRoleBadgeVariant, getEmploymentTypeLabel, getInitials } from '../utils/employeeUtils';
import { getRoleDisplayName } from '@/utils/roleUtils';
import { UnifiedEmployee } from '../hooks/useEmployees';

interface EmployeeViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee: UnifiedEmployee | null;
  employeeProjects: any[];
  loadingProjects: boolean;
  onNavigateToDepartment: (departmentId: string, departmentName?: string) => void;
  onNavigateToProjects: (params: { employeeId: string; employeeName: string; departmentId?: string; departmentName?: string }) => void;
  onNavigateToAttendance: (params: { employeeId: string; employeeName: string; departmentId?: string; departmentName?: string }) => void;
  onNavigateToPayroll: (params: { employeeId: string; employeeName: string; departmentId?: string; departmentName?: string }) => void;
}

export const EmployeeViewDialog = ({
  isOpen,
  onClose,
  employee,
  employeeProjects,
  loadingProjects,
  onNavigateToDepartment,
  onNavigateToProjects,
  onNavigateToAttendance,
  onNavigateToPayroll,
}: EmployeeViewDialogProps) => {
  const navigate = useNavigate();

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Employee Details</DialogTitle>
          <DialogDescription>Complete information about this employee</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects ({employeeProjects.length})</TabsTrigger>
            <TabsTrigger value="actions">Quick Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarImage 
                  src={employee.avatar_url && employee.avatar_url.startsWith('data:') 
                    ? employee.avatar_url 
                    : employee.avatar_url || undefined} 
                  alt={employee.full_name} 
                />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                  {getInitials(employee.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-2xl font-semibold">{employee.full_name}</h3>
                <p className="text-muted-foreground">{employee.position || 'No position'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={getRoleBadgeVariant(employee.role)}>
                    {getRoleDisplayName(employee.role as any)}
                  </Badge>
                  <Badge variant={employee.is_active ? 'default' : 'destructive'}>
                    {employee.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium break-all">{employee.email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Phone</p>
                <p className="font-medium">{employee.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge variant={employee.is_active ? 'default' : 'destructive'} className="mt-1">
                  {employee.is_active ? 'Active' : 'Trash'}
                </Badge>
              </div>
              {employee.employee_id && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Employee ID</p>
                  <p className="font-medium font-mono">{employee.employee_id}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Department</p>
                {employee.department && employee.department_id ? (
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-secondary/80 transition-colors mt-1"
                    onClick={() => {
                      onClose();
                      onNavigateToDepartment(employee.department_id!, employee.department || undefined);
                    }}
                  >
                    <Building2 className="h-3 w-3 mr-1" />
                    {employee.department}
                  </Badge>
                ) : (
                  <p className="font-medium">Not assigned</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Position</p>
                <p className="font-medium">{employee.position || 'Not specified'}</p>
              </div>
              {employee.employment_type && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Employment Type</p>
                  <p className="font-medium">{getEmploymentTypeLabel(employee.employment_type)}</p>
                </div>
              )}
              {employee.work_location && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Work Location</p>
                  <p className="font-medium">{employee.work_location}</p>
                </div>
              )}
              {employee.hire_date && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Hire Date</p>
                  <p className="font-medium">
                    {new Date(employee.hire_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              {employee.emergency_contact_name && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Emergency Contact</p>
                  <p className="font-medium">
                    {employee.emergency_contact_name}
                    {employee.emergency_contact_phone && ` (${employee.emergency_contact_phone})`}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="projects" className="mt-4">
            {loadingProjects ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading projects...</p>
              </div>
            ) : employeeProjects.length > 0 ? (
              <div className="space-y-3">
                {employeeProjects.map((project: any) => (
                  <Card key={project.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{project.name}</h4>
                            {project.project_code && (
                              <Badge variant="outline">{project.project_code}</Badge>
                            )}
                            <Badge variant={
                              project.status === 'completed' ? 'default' :
                              project.status === 'in_progress' ? 'secondary' :
                              'outline'
                            }>
                              {project.status}
                            </Badge>
                            {(project.project_manager_id === employee.user_id) && (
                              <Badge variant="secondary">Project Manager</Badge>
                            )}
                            {(project.account_manager_id === employee.user_id) && (
                              <Badge variant="secondary">Account Manager</Badge>
                            )}
                          </div>
                          {project.client && (
                            <p className="text-sm text-muted-foreground mb-2">
                              Client: {project.client.company_name || project.client.name}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            {project.start_date && (
                              <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
                            )}
                            {project.budget && (
                              <span>Budget: {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: project.currency || 'USD'
                              }).format(project.budget)}</span>
                            )}
                            <span>Progress: {project.progress}%</span>
                          </div>
                          {project.progress > 0 && (
                            <Progress value={project.progress} className="h-2" />
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onClose();
                            navigate(`/project-management/${project.id}`);
                          }}
                        >
                          View <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No projects assigned to this employee</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="actions" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {employee.department_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClose();
                      onNavigateToDepartment(employee.department_id!, employee.department || undefined);
                    }}
                    className="w-full"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    View Department
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onNavigateToProjects({ 
                      employeeId: employee.user_id, 
                      employeeName: employee.full_name,
                      departmentId: employee.department_id,
                      departmentName: employee.department || undefined
                    });
                  }}
                  className="w-full"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  View All Projects
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onNavigateToAttendance({ 
                      employeeId: employee.user_id, 
                      employeeName: employee.full_name,
                      departmentId: employee.department_id,
                      departmentName: employee.department || undefined
                    });
                  }}
                  className="w-full"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  View Attendance
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onNavigateToPayroll({ 
                      employeeId: employee.user_id, 
                      employeeName: employee.full_name,
                      departmentId: employee.department_id,
                      departmentName: employee.department || undefined
                    });
                  }}
                  className="w-full"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  View Payroll
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    navigate(`/employee-performance?employeeId=${employee.user_id}`);
                  }}
                  className="w-full"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Performance
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

