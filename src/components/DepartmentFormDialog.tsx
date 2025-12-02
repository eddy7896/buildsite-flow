import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from '@/lib/database';
import { useToast } from "@/hooks/use-toast";

interface Department {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  parent_department_id?: string;
  budget?: number;
}

interface Profile {
  user_id: string;
  full_name: string;
}

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department;
  onDepartmentSaved: () => void;
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
  onDepartmentSaved,
}: DepartmentFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    manager_id: "",
    parent_department_id: "",
    budget: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchDepartments();
      fetchProfiles();
      if (department) {
        setFormData({
          name: department.name,
          description: department.description || "",
          manager_id: department.manager_id || "",
          parent_department_id: department.parent_department_id || "",
          budget: department.budget?.toString() || "",
        });
      } else {
        setFormData({
          name: "",
          description: "",
          manager_id: "",
          parent_department_id: "",
          budget: "",
        });
      }
    }
  }, [open, department]);

  const fetchDepartments = async () => {
    const { data } = await supabase
      .from("departments")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    if (data) {
      setDepartments(data);
    }
  };

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .eq("is_active", true)
      .order("full_name");

    if (data) {
      setProfiles(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const departmentData = {
        name: formData.name,
        description: formData.description || null,
        manager_id: formData.manager_id || null,
        parent_department_id: formData.parent_department_id || null,
        budget: formData.budget ? parseFloat(formData.budget) : 0,
      };

      if (department) {
        const { error } = await supabase
          .from("departments")
          .update(departmentData)
          .eq("id", department.id);

        if (error) throw error;
        toast({ title: "Department updated successfully" });
      } else {
        const { error } = await supabase
          .from("departments")
          .insert([departmentData]);

        if (error) throw error;
        toast({ title: "Department created successfully" });
      }

      onDepartmentSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving department:", error);
      toast({
        title: "Error",
        description: "Failed to save department",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {department ? "Edit Department" : "Create Department"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Department Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label>Parent Department</Label>
            <Select
              value={formData.parent_department_id}
              onValueChange={(value) => setFormData({ ...formData, parent_department_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent department (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None (Top Level)</SelectItem>
                {departments
                  .filter(d => d.id !== department?.id)
                  .map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Department Manager</Label>
            <Select
              value={formData.manager_id}
              onValueChange={(value) => setFormData({ ...formData, manager_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department manager (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Manager Assigned</SelectItem>
                {profiles.map((profile) => (
                  <SelectItem key={profile.user_id} value={profile.user_id}>
                    {profile.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="budget">Budget</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              min="0"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : department ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}