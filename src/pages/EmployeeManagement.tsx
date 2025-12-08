import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  Plus, Search, Filter, Mail, Phone, Loader2, Edit, Trash2, Eye, 
  Users, UserCheck, UserX, Briefcase, Shield, Crown, Star, MapPin, 
  Calendar, Building2, UserPlus, X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import UserFormDialog from "@/components/UserFormDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { selectRecords, updateRecord, deleteRecord } from '@/services/api/postgresql-service';
import { getRoleDisplayName, ROLE_CATEGORIES } from '@/utils/roleUtils';

interface UnifiedEmployee {
  id: string;
  user_id: string;
  employee_id?: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  role: string;
  status: 'active' | 'inactive';
  is_active: boolean;
  hire_date?: string;
  employment_type?: string;
  work_location?: string;
  avatar_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

const EmployeeManagement = () => {
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  
  const [employees, setEmployees] = useState<UnifiedEmployee[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

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

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const profilesData = await selectRecords('profiles', {
        orderBy: 'full_name ASC'
      });

      // Fetch user roles
      const rolesData = await selectRecords('user_roles', {
        select: 'user_id, role'
      });

      // Fetch employee details
      const employeeDetailsData = await selectRecords('employee_details', {
        select: 'id, user_id, employee_id, first_name, last_name, employment_type, work_location, is_active, emergency_contact_name, emergency_contact_phone'
      });

      // Fetch users for email
      const userIds = profilesData.map((p: any) => p.user_id).filter(Boolean);
      let usersData: any[] = [];
      if (userIds.length > 0) {
        usersData = await selectRecords('users', {
          select: 'id, email, is_active',
          filters: [
            { column: 'id', operator: 'in', value: userIds }
          ]
        });
      }

      // Create maps for quick lookup
      const roleMap = new Map<string, string>();
      rolesData?.forEach((r: any) => {
        roleMap.set(r.user_id, r.role);
      });

      const employeeMap = new Map<string, any>();
      employeeDetailsData?.forEach((e: any) => {
        employeeMap.set(e.user_id, e);
      });

      const userMap = new Map<string, any>();
      usersData?.forEach((u: any) => {
        userMap.set(u.id, u);
      });

      // Transform and merge data
      const unifiedEmployees: UnifiedEmployee[] = profilesData.map((profile: any) => {
        const employeeDetail = employeeMap.get(profile.user_id);
        const userData = userMap.get(profile.user_id);
        const role = roleMap.get(profile.user_id) || 'employee';
        
        return {
          id: employeeDetail?.id || profile.id,
          user_id: profile.user_id,
          employee_id: employeeDetail?.employee_id,
          full_name: profile.full_name || `${employeeDetail?.first_name || ''} ${employeeDetail?.last_name || ''}`.trim() || 'Unknown User',
          first_name: employeeDetail?.first_name || profile.full_name?.split(' ')[0] || '',
          last_name: employeeDetail?.last_name || profile.full_name?.split(' ').slice(1).join(' ') || '',
          email: userData?.email || `${(profile.full_name || 'user').toLowerCase().replace(/\s+/g, '.')}@company.com`,
          phone: profile.phone,
          department: profile.department,
          position: profile.position,
          role: role,
          status: (profile.is_active && userData?.is_active !== false) ? 'active' : 'inactive',
          is_active: profile.is_active && userData?.is_active !== false,
          hire_date: profile.hire_date,
          employment_type: employeeDetail?.employment_type,
          work_location: employeeDetail?.work_location,
          avatar_url: profile.avatar_url,
          emergency_contact_name: employeeDetail?.emergency_contact_name,
          emergency_contact_phone: employeeDetail?.emergency_contact_phone,
        };
      });

      setEmployees(unifiedEmployees);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch employees. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEmployees = () => {
    let filtered = employees;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tab filter
    if (selectedTab === 'active') {
      filtered = filtered.filter(emp => emp.is_active);
    } else if (selectedTab === 'inactive') {
      filtered = filtered.filter(emp => !emp.is_active);
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(emp => emp.role === roleFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(emp => emp.status === statusFilter);
    }

    return filtered;
  };

  const filteredEmployees = getFilteredEmployees();

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.is_active).length,
    inactive: employees.filter(e => !e.is_active).length,
    admins: employees.filter(e => ['super_admin', 'admin'].includes(e.role)).length,
    managers: employees.filter(e => ROLE_CATEGORIES.management.includes(e.role as any)).length,
    departments: new Set(employees.map(e => e.department).filter(Boolean)).size,
  };

  const handleViewEmployee = (employee: UnifiedEmployee) => {
    setSelectedEmployee(employee);
    setShowViewDialog(true);
  };

  const handleEditEmployee = (employee: UnifiedEmployee) => {
    // Check if this is a user (has user_id but no employee_id) or an employee
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
      // Normalize employment_type - convert hyphens to underscores for form state
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
    if (!employee.employee_id) {
      // This is a user, show user delete dialog
      setSelectedUserForDelete(employee);
      setShowUserDeleteDialog(true);
    } else {
      // This is an employee, show employee delete dialog
      setSelectedEmployee(employee);
      setShowDeleteDialog(true);
    }
  };

  const handleSaveEmployee = async () => {
    if (!selectedEmployee || !user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to update employees",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    try {
      // Update profile
      await updateRecord('profiles', {
        phone: editForm.phone,
        department: editForm.department,
        position: editForm.position,
      }, { user_id: selectedEmployee.user_id }, user.id);

      // Update employee_details if exists
      const employeeDetails = await selectRecords('employee_details', {
        filters: [{ column: 'user_id', operator: 'eq', value: selectedEmployee.user_id }]
      });

      if (employeeDetails.length > 0) {
        // Normalize employment_type to database format (hyphens)
        const normalizedEmploymentType = normalizeEmploymentType(editForm.employment_type);
        await updateRecord('employee_details', {
          employment_type: normalizedEmploymentType,
          work_location: editForm.work_location,
          is_active: editForm.is_active,
        }, { user_id: selectedEmployee.user_id }, user.id);
      }

      toast({
        title: "Success",
        description: "Employee updated successfully",
      });

      setShowEditDialog(false);
      fetchEmployees();
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update employee",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!selectedEmployee || !user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to delete employees",
        variant: "destructive",
      });
      return;
    }

    try {
      // Soft delete employee_details (set is_active to false) if exists
      const employeeDetails = await selectRecords('employee_details', {
        filters: [{ column: 'user_id', operator: 'eq', value: selectedEmployee.user_id }]
      });

      if (employeeDetails.length > 0) {
        await updateRecord('employee_details', {
          is_active: false
        }, { id: employeeDetails[0].id }, user.id);
      }

      // Soft delete profile (set is_active to false)
      await updateRecord('profiles', {
        is_active: false
      }, { user_id: selectedEmployee.user_id }, user.id);

      // Also soft delete user if it exists
      await updateRecord('users', {
        is_active: false
      }, { id: selectedEmployee.user_id }, user.id);

      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });

      setShowDeleteDialog(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: error.message || error.detail || "Failed to delete employee",
        variant: "destructive",
      });
    }
  };

  const handleUserDeleteConfirmed = async () => {
    if (!selectedUserForDelete || !user?.id) return;

    try {
      // Soft delete user (set is_active to false in users table)
      await updateRecord('users', {
        is_active: false
      }, { id: selectedUserForDelete.user_id }, user.id);

      // Soft delete profile (set is_active to false)
      await updateRecord('profiles', {
        is_active: false
      }, { user_id: selectedUserForDelete.user_id }, user.id);

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      setShowUserDeleteDialog(false);
      setSelectedUserForDelete(null);
      fetchEmployees();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    if (ROLE_CATEGORIES.executive.includes(role as any)) return Crown;
    if (ROLE_CATEGORIES.management.includes(role as any)) return Shield;
    return Star;
  };

  const getRoleBadgeVariant = (role: string) => {
    if (ROLE_CATEGORIES.executive.includes(role as any)) return 'default';
    if (ROLE_CATEGORIES.management.includes(role as any)) return 'secondary';
    return 'outline';
  };

  const getEmploymentTypeLabel = (type?: string) => {
    switch (type) {
      case 'full_time':
      case 'full-time':
        return 'Full Time';
      case 'part_time':
      case 'part-time':
        return 'Part Time';
      case 'contract': return 'Contract';
      case 'intern': return 'Intern';
      default: return type || 'Full Time';
    }
  };

  // Normalize employment_type to database format (hyphens)
  const normalizeEmploymentType = (type?: string): string => {
    if (!type) return 'full-time';
    // Convert underscores to hyphens (replace all occurrences)
    return type.replace(/_/g, '-');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Employee Management</h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            Manage all employees, users, and team members in one place
          </p>
        </div>
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 flex-shrink-0" />
              <div className="ml-4 min-w-0">
                <p className="text-sm text-muted-foreground truncate">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600 flex-shrink-0" />
              <div className="ml-4 min-w-0">
                <p className="text-sm text-muted-foreground truncate">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <UserX className="h-8 w-8 text-red-600 flex-shrink-0" />
              <div className="ml-4 min-w-0">
                <p className="text-sm text-muted-foreground truncate">Inactive</p>
                <p className="text-2xl font-bold">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600 flex-shrink-0" />
              <div className="ml-4 min-w-0">
                <p className="text-sm text-muted-foreground truncate">Admins</p>
                <p className="text-2xl font-bold">{stats.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-orange-600 flex-shrink-0" />
              <div className="ml-4 min-w-0">
                <p className="text-sm text-muted-foreground truncate">Managers</p>
                <p className="text-2xl font-bold">{stats.managers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-indigo-600 flex-shrink-0" />
              <div className="ml-4 min-w-0">
                <p className="text-sm text-muted-foreground truncate">Depts</p>
                <p className="text-2xl font-bold">{stats.departments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, ID, department, or position..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="finance_manager">Finance Manager</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="w-full lg:w-auto">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="all">All ({employees.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({stats.inactive})</TabsTrigger>
          <TabsTrigger value="admins">Admins ({stats.admins})</TabsTrigger>
          <TabsTrigger value="managers">Managers ({stats.managers})</TabsTrigger>
        </TabsList>

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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredEmployees.map((employee) => {
                const RoleIcon = getRoleIcon(employee.role);
                
                return (
                  <Card key={employee.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-12 w-12 border-2 border-primary/20 flex-shrink-0">
                          <AvatarImage 
                            src={employee.avatar_url && employee.avatar_url.startsWith('data:') 
                              ? employee.avatar_url 
                              : employee.avatar_url || undefined} 
                            alt={employee.full_name} 
                          />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(employee.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base leading-5 truncate mb-1">
                            {employee.full_name}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mb-2">
                            <RoleIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <Badge variant={getRoleBadgeVariant(employee.role)} className="text-xs">
                              {getRoleDisplayName(employee.role as any)}
                            </Badge>
                          </div>
                          {employee.position && (
                            <p className="text-xs text-muted-foreground truncate">
                              {employee.position}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="space-y-2 text-sm">
                        {employee.email && (
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate text-xs">{employee.email}</span>
                          </div>
                        )}
                        
                        {employee.phone && (
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span className="text-xs">{employee.phone}</span>
                          </div>
                        )}
                        
                        {employee.work_location && (
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate text-xs">{employee.work_location}</span>
                          </div>
                        )}
                        
                        {employee.hire_date && (
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="text-xs">
                              Joined {new Date(employee.hire_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {employee.department && (
                            <Badge variant="outline" className="text-xs">
                              {employee.department}
                            </Badge>
                          )}
                          {employee.employment_type && (
                            <Badge variant="secondary" className="text-xs">
                              {getEmploymentTypeLabel(employee.employment_type)}
                            </Badge>
                          )}
                          <Badge 
                            variant={employee.is_active ? 'default' : 'destructive'} 
                            className="text-xs"
                          >
                            {employee.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        {employee.employee_id && (
                          <p className="text-xs text-muted-foreground font-mono">
                            ID: {employee.employee_id}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleViewEmployee(employee)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditEmployee(employee)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteEmployee(employee)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View Employee Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
            <DialogDescription>Complete information about this employee</DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20 border-2 border-primary/20">
                  <AvatarImage 
                    src={selectedEmployee.avatar_url && selectedEmployee.avatar_url.startsWith('data:') 
                      ? selectedEmployee.avatar_url 
                      : selectedEmployee.avatar_url || undefined} 
                    alt={selectedEmployee.full_name} 
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                    {getInitials(selectedEmployee.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-semibold">{selectedEmployee.full_name}</h3>
                  <p className="text-muted-foreground">{selectedEmployee.position || 'No position'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={getRoleBadgeVariant(selectedEmployee.role)}>
                      {getRoleDisplayName(selectedEmployee.role as any)}
                    </Badge>
                    <Badge variant={selectedEmployee.is_active ? 'default' : 'destructive'}>
                      {selectedEmployee.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="font-medium break-all">{selectedEmployee.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone</p>
                  <p className="font-medium">{selectedEmployee.phone || 'Not provided'}</p>
                </div>
                {selectedEmployee.employee_id && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Employee ID</p>
                    <p className="font-medium font-mono">{selectedEmployee.employee_id}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Department</p>
                  <p className="font-medium">{selectedEmployee.department || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Employment Type</p>
                  <p className="font-medium">{getEmploymentTypeLabel(selectedEmployee.employment_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Work Location</p>
                  <p className="font-medium">{selectedEmployee.work_location || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Hire Date</p>
                  <p className="font-medium">
                    {selectedEmployee.hire_date 
                      ? new Date(selectedEmployee.hire_date).toLocaleDateString()
                      : 'Not specified'}
                  </p>
                </div>
                {selectedEmployee.emergency_contact_name && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Emergency Contact</p>
                    <p className="font-medium">
                      {selectedEmployee.emergency_contact_name}
                      {selectedEmployee.emergency_contact_phone && ` (${selectedEmployee.emergency_contact_phone})`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  value={editForm.full_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Position</label>
                <Input
                  value={editForm.position || ''}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Select
                  value={editForm.department || ''}
                  onValueChange={(value) => setEditForm({ ...editForm, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Employment Type</label>
                <Select
                  value={editForm.employment_type || 'full_time'}
                  onValueChange={(value) => setEditForm({ ...editForm, employment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={editForm.is_active ? 'active' : 'inactive'}
                  onValueChange={(value) => setEditForm({ ...editForm, is_active: value === 'active' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Work Location</label>
              <Input
                value={editForm.work_location || ''}
                onChange={(e) => setEditForm({ ...editForm, work_location: e.target.value })}
                placeholder="e.g., New York, NY"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEmployee} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onDeleted={handleDeleteConfirmed}
        itemType="Employee"
        itemName={selectedEmployee ? selectedEmployee.full_name : ''}
        itemId={selectedEmployee?.id || ''}
        tableName="employee_details"
        userId={user?.id}
      />

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

      {/* User Delete Dialog - Use custom handler instead of DeleteConfirmDialog for users */}
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

