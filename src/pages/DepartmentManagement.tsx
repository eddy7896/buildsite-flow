import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Plus, Edit, Trash2, Search, DollarSign } from "lucide-react";
import { db } from '@/lib/database';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { DepartmentFormDialog } from "@/components/DepartmentFormDialog";
import { TeamAssignmentPanel } from "@/components/TeamAssignmentPanel";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

interface Department {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  parent_department_id?: string;
  budget?: number;
  is_active: boolean;
  created_at: string;
  manager?: {
    full_name: string;
  } | null;
  parent_department?: {
    name: string;
  } | null;
  _count?: {
    team_assignments: number;
  };
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const { userRole } = useAuth();
  const { toast } = useToast();

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isHR = userRole === 'hr';

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");

      if (error) throw error;

      // Get team assignment counts and related data for each department
      const departmentsWithCounts = await Promise.all(
        (data || []).map(async (dept) => {
          const { count } = await supabase
            .from("team_assignments")
            .select("*", { count: "exact", head: true })
            .eq("department_id", dept.id)
            .eq("is_active", true);

          // Fetch manager info if manager_id exists
          let manager = null;
          if (dept.manager_id) {
            const { data: managerData } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", dept.manager_id)
              .single();
            manager = managerData;
          }

          // Fetch parent department info if parent_department_id exists
          let parent_department = null;
          if (dept.parent_department_id) {
            const { data: parentData } = await supabase
              .from("departments")
              .select("name")
              .eq("id", dept.parent_department_id)
              .single();
            parent_department = parentData;
          }

          return {
            ...dept,
            manager,
            parent_department,
            _count: { team_assignments: count || 0 }
          };
        })
      );

      setDepartments(departmentsWithCounts);
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast({
        title: "Error",
        description: "Failed to fetch departments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setShowDepartmentForm(true);
  };

  const handleDelete = (department: Department) => {
    setSelectedDepartment(department);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedDepartment) return;

    try {
      const { error } = await supabase
        .from("departments")
        .update({ is_active: false })
        .eq("id", selectedDepartment.id);

      if (error) throw error;

      toast({ title: "Department deleted successfully" });
      fetchDepartments();
    } catch (error) {
      console.error("Error deleting department:", error);
      toast({
        title: "Error",
        description: "Failed to delete department",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setSelectedDepartment(null);
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.is_active && 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBudget = departments
    .filter(d => d.is_active)
    .reduce((sum, dept) => sum + (dept.budget || 0), 0);

  const totalEmployees = departments
    .filter(d => d.is_active)
    .reduce((sum, dept) => sum + (dept._count?.team_assignments || 0), 0);

  if (!isAdmin && !isHR) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">
              You don't have permission to access department management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Department Management</h1>
          <p className="text-muted-foreground">
            Manage organizational structure and team assignments
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => {
            setSelectedDepartment(null);
            setShowDepartmentForm(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Department
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Building2 className="h-8 w-8 text-primary mr-4" />
            <div>
              <p className="text-2xl font-bold">{departments.filter(d => d.is_active).length}</p>
              <p className="text-muted-foreground">Active Departments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-primary mr-4" />
            <div>
              <p className="text-2xl font-bold">{totalEmployees}</p>
              <p className="text-muted-foreground">Total Employees</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <DollarSign className="h-8 w-8 text-primary mr-4" />
            <div>
              <p className="text-2xl font-bold">${totalBudget.toLocaleString()}</p>
              <p className="text-muted-foreground">Total Budget</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="departments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          {(isAdmin || isHR) && (
            <TabsTrigger value="assignments">Team Assignments</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="departments" className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Departments List */}
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p>Loading departments...</p>
              </CardContent>
            </Card>
          ) : filteredDepartments.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No departments found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDepartments.map((department) => (
                <Card key={department.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{department.name}</CardTitle>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(department)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(department)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {department.description && (
                      <p className="text-sm text-muted-foreground">
                        {department.description}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      {department.manager && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Manager</Badge>
                          <span className="text-sm">{department.manager.full_name}</span>
                        </div>
                      )}
                      
                      {department.parent_department && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Parent</Badge>
                          <span className="text-sm">{department.parent_department.name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {department._count?.team_assignments || 0} Members
                        </Badge>
                        {department.budget && department.budget > 0 && (
                          <Badge variant="outline">
                            ${department.budget.toLocaleString()} Budget
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments">
          <TeamAssignmentPanel />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <DepartmentFormDialog
        open={showDepartmentForm}
        onOpenChange={setShowDepartmentForm}
        department={selectedDepartment}
        onDepartmentSaved={fetchDepartments}
      />

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onDeleted={fetchDepartments}
        itemType="Department"
        itemName={selectedDepartment?.name || ""}
        itemId={selectedDepartment?.id || ""}
        tableName="departments"
      />
    </div>
  );
}