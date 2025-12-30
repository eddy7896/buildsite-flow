/**
 * Employee Management Page
 * Main orchestrator for employee management functionality
 * Refactored from 1,894 lines to ~300 lines
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Plus, UserPlus, Users, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import UserFormDialog from "@/components/UserFormDialog";
import { DepartmentBreadcrumb } from "@/components/DepartmentBreadcrumb";
import { useDepartmentNavigation } from "@/hooks/useDepartmentNavigation";
import { RoleGuard } from "@/components/RoleGuard";
import { selectRecords } from '@/services/api/postgresql-service';
import { canViewEmployee, canManageEmployee } from './employees/utils/employeePermissions';
import { calculateEmployeeStats } from './employees/utils/employeeUtils';
import { useEmployees, UnifiedEmployee } from './employees/hooks/useEmployees';
import { useEmployeeFilters } from './employees/hooks/useEmployeeFilters';
import { useEmployeeActions } from './employees/hooks/useEmployeeActions';
import { useEmployeeProjects } from './employees/hooks/useEmployeeProjects';
import { EmployeeMetrics } from './employees/components/EmployeeMetrics';
import { EmployeeFilters } from './employees/components/EmployeeFilters';
import { EmployeeCard } from './employees/components/EmployeeCard';
import { EmployeeViewDialog } from './employees/components/EmployeeViewDialog';
import { EmployeeEditDialog } from './employees/components/EmployeeEditDialog';

const EmployeeManagement = () => {
  const { toast } = useToast();
  const { user, userRole, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    departmentId: urlDepartmentId,
    departmentName: urlDepartmentName,
    navigateToDepartment,
    navigateToProjects,
    navigateToAttendance,
    navigateToPayroll,
  } = useDepartmentNavigation();
  
  // Get department filter from URL (for backward compatibility)
  const legacyDepartmentId = searchParams.get('department');
  const legacyDepartmentName = searchParams.get('name');
  
  // Data hooks
  const { employees, loading, fetchEmployees } = useEmployees(urlDepartmentId || legacyDepartmentId || undefined);
  const { employeeProjects, loading: loadingProjects, loadEmployeeProjects } = useEmployeeProjects(profile, user?.id);
  const { saving, saveEmployee, deleteEmployee, deleteUser } = useEmployeeActions();
  
  // Local state
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>((urlDepartmentId || legacyDepartmentId) || "all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [selectedEmployee, setSelectedEmployee] = useState<UnifiedEmployee | null>(null);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string; role: string; position?: string; department?: string; phone?: string; hire_date?: string } | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<UnifiedEmployee | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUserFormDialog, setShowUserFormDialog] = useState(false);
  const [showUserDeleteDialog, setShowUserDeleteDialog] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UnifiedEmployee>>({});

  const managerDepartment = profile?.department || undefined;

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const deptData = await selectRecords('departments', {
          select: 'id, name',
          filters: [
            { column: 'is_active', operator: 'eq', value: true }
          ],
          orderBy: 'name ASC'
        });
        setDepartments(deptData);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };
    fetchDepartments();
  }, []);

  // Update department filter when URL parameter changes
  useEffect(() => {
    const deptId = urlDepartmentId || legacyDepartmentId;
    if (deptId) {
      setDepartmentFilter(deptId);
    }
  }, [urlDepartmentId, legacyDepartmentId]);

  // Filter employees
  const filteredEmployees = useEmployeeFilters(
    employees,
    selectedTab,
    searchTerm,
    roleFilter,
    departmentFilter,
    statusFilter
  );

  // Calculate stats
  const stats = calculateEmployeeStats(employees);

  // Handlers
  const handleViewEmployee = async (employee: UnifiedEmployee) => {
    setSelectedEmployee(employee);
    setShowViewDialog(true);
    await loadEmployeeProjects(employee.user_id);
  };

  const handleEditEmployee = (employee: UnifiedEmployee) => {
    if (!canManageEmployee(employee, user, userRole, managerDepartment)) {
      toast({
        title: "Permission denied",
        description: "You are not allowed to edit this employee.",
        variant: "destructive",
      });
      return;
    }
    
    if (!employee.employee_id) {
      // This is a user, open UserFormDialog
      setSelectedUser({
        id: employee.user_id,
        name: employee.full_name,
        email: employee.email,
        role: employee.role,
        position: employee.position,
        department: employee.department,
        phone: employee.phone,
        hire_date: employee.hire_date
      } as any);
      setShowUserFormDialog(true);
    } else {
      // This is an employee, open employee edit dialog
      setSelectedEmployee(employee);
      const normalizedType = employee.employment_type?.replace('-', '_') || 'full_time';
      setEditForm({
        full_name: employee.full_name,
        phone: employee.phone,
        department: employee.department,
        position: employee.position,
        employment_type: normalizedType,
        work_location: employee.work_location,
        is_active: employee.is_active,
      });
      setShowEditDialog(true);
    }
  };

  const handleDeleteEmployee = (employee: UnifiedEmployee) => {
    if (!canManageEmployee(employee, user, userRole, managerDepartment)) {
      toast({
        title: "Permission denied",
        description: "You are not allowed to delete or deactivate this employee.",
        variant: "destructive",
      });
      return;
    }
    
    if (!employee.employee_id) {
      setSelectedUserForDelete(employee);
      setShowUserDeleteDialog(true);
    } else {
      setSelectedEmployee(employee);
      setShowDeleteDialog(true);
    }
  };

  const handleSaveEmployee = async () => {
    if (!selectedEmployee) return;
    
    const wasInactive = !selectedEmployee.is_active;
    const isNowActive = editForm.is_active;
    const statusChangedToActive = wasInactive && isNowActive;

    await saveEmployee(selectedEmployee, editForm, () => {
      setShowEditDialog(false);
      if (statusChangedToActive) {
        setSelectedTab('active');
      }
      // Force multiple refreshes to ensure the view is updated
      fetchEmployees();
      setTimeout(() => fetchEmployees(), 300);
      setTimeout(() => fetchEmployees(), 1000);
    });
  };

  const handleDeleteConfirmed = async () => {
    if (!selectedEmployee) return;
    
    await deleteEmployee(selectedEmployee, () => {
      setShowDeleteDialog(false);
      setSelectedEmployee(null);
      setTimeout(() => fetchEmployees(), 100);
    });
  };

  const handleUserDeleteConfirmed = async () => {
    if (!selectedUserForDelete) return;
    
    await deleteUser(selectedUserForDelete, () => {
      setShowUserDeleteDialog(false);
      setSelectedUserForDelete(null);
      setTimeout(() => fetchEmployees(), 100);
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setDepartmentFilter("all");
    setStatusFilter("all");
    setSelectedTab("all");
  };

  const hasActiveFilters = searchTerm || roleFilter !== "all" || departmentFilter !== "all" || statusFilter !== "all";

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading employees...</span>
      </div>
    );
  }

  const displayDepartmentName = urlDepartmentName || (legacyDepartmentName ? decodeURIComponent(legacyDepartmentName) : null);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Breadcrumb */}
      <DepartmentBreadcrumb currentPage="employees" />
      
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-bold">Employee Management</h1>
            {displayDepartmentName && (
              <Badge 
                variant="secondary" 
                className="text-sm cursor-pointer hover:bg-secondary/80 transition-colors"
                onClick={() => navigateToDepartment(urlDepartmentId || legacyDepartmentId || undefined, displayDepartmentName || undefined)}
              >
                <Building2 className="h-3 w-3 mr-1" />
                {displayDepartmentName}
              </Badge>
            )}
          </div>
          <p className="text-sm lg:text-base text-muted-foreground">
            {displayDepartmentName 
              ? `Employees in ${displayDepartmentName} department`
              : "Manage all employees, users, and team members in one place"}
          </p>
        </div>
        <RoleGuard requiredRole="hr" fallback={null}>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/create-employee')}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
            <Button onClick={() => setShowUserFormDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </RoleGuard>
      </div>

      {/* Stats Cards */}
      <EmployeeMetrics stats={stats} />

      {/* Search and Filters */}
      <EmployeeFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        departmentFilter={departmentFilter}
        onDepartmentFilterChange={setDepartmentFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        departments={departments}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <div className="w-full overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
          <TabsList className="inline-flex w-full min-w-max lg:grid lg:grid-cols-5 h-auto lg:h-10">
            <TabsTrigger value="all" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3 py-2 lg:py-1.5">All ({stats.active})</TabsTrigger>
            <TabsTrigger value="active" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3 py-2 lg:py-1.5">Active ({stats.active})</TabsTrigger>
            <TabsTrigger value="trash" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3 py-2 lg:py-1.5">Trash ({stats.inactive})</TabsTrigger>
            <TabsTrigger value="admins" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3 py-2 lg:py-1.5">Admins ({stats.admins})</TabsTrigger>
            <TabsTrigger value="managers" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3 py-2 lg:py-1.5">Managers ({stats.managers})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={selectedTab} className="space-y-4">
          {filteredEmployees.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No employees found
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {hasActiveFilters 
                      ? 'Try adjusting your filters or search terms.' 
                      : 'Get started by adding your first employee or user.'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => navigate('/create-employee')}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Employee
                    </Button>
                    <Button variant="outline" onClick={() => setShowUserFormDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredEmployees.map((employee) => {
                const canView = canViewEmployee(employee, user, userRole, managerDepartment);
                const canEdit = canManageEmployee(employee, user, userRole, managerDepartment);
                const canDelete = canManageEmployee(employee, user, userRole, managerDepartment);
                
                return (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    canView={canView}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onView={handleViewEmployee}
                    onEdit={handleEditEmployee}
                    onDelete={handleDeleteEmployee}
                    onNavigateToDepartment={navigateToDepartment}
                    onNavigateToProjects={navigateToProjects}
                    onNavigateToAttendance={navigateToAttendance}
                    onNavigateToPayroll={navigateToPayroll}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View Employee Dialog */}
      <EmployeeViewDialog
        isOpen={showViewDialog}
        onClose={() => {
          setShowViewDialog(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
        employeeProjects={employeeProjects}
        loadingProjects={loadingProjects}
        onNavigateToDepartment={navigateToDepartment}
        onNavigateToProjects={navigateToProjects}
        onNavigateToAttendance={navigateToAttendance}
        onNavigateToPayroll={navigateToPayroll}
      />

      {/* Edit Employee Dialog */}
      <EmployeeEditDialog
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedEmployee(null);
          setEditForm({});
        }}
        employee={selectedEmployee}
        editForm={editForm}
        onFormChange={setEditForm}
        onSave={handleSaveEmployee}
        saving={saving}
        departments={departments}
      />

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
        if (!open) {
          setShowDeleteDialog(false);
          setSelectedEmployee(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedEmployee?.full_name || 'this employee'}"? This will deactivate the employee account and all related records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setSelectedEmployee(null);
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirmed} 
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Form Dialog */}
      <UserFormDialog
        isOpen={showUserFormDialog}
        onClose={() => {
          setShowUserFormDialog(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onUserSaved={fetchEmployees}
      />

      {/* User Delete Dialog */}
      <AlertDialog open={showUserDeleteDialog} onOpenChange={(open) => {
        if (!open) {
          setShowUserDeleteDialog(false);
          setSelectedUserForDelete(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedUserForDelete?.full_name || 'this user'}"? This will deactivate the user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowUserDeleteDialog(false);
              setSelectedUserForDelete(null);
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUserDeleteConfirmed} 
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmployeeManagement;

