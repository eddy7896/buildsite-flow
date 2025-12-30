/**
 * Employee Edit Dialog Component
 * Form for editing employee information
 */

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { UnifiedEmployee } from '../hooks/useEmployees';

interface EmployeeEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee: UnifiedEmployee | null;
  editForm: Partial<UnifiedEmployee>;
  onFormChange: (form: Partial<UnifiedEmployee>) => void;
  onSave: () => void;
  saving: boolean;
  departments: { id: string; name: string }[];
}

export const EmployeeEditDialog = ({
  isOpen,
  onClose,
  employee,
  editForm,
  onFormChange,
  onSave,
  saving,
  departments,
}: EmployeeEditDialogProps) => {
  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                onChange={(e) => onFormChange({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={editForm.phone || ''}
                onChange={(e) => onFormChange({ ...editForm, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Position</label>
              <Input
                value={editForm.position || ''}
                onChange={(e) => onFormChange({ ...editForm, position: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Select
                value={editForm.department || ''}
                onValueChange={(value) => onFormChange({ ...editForm, department: value })}
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
                onValueChange={(value) => onFormChange({ ...editForm, employment_type: value })}
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
                onValueChange={(value) => onFormChange({ ...editForm, is_active: value === 'active' })}
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
              onChange={(e) => onFormChange({ ...editForm, work_location: e.target.value })}
              placeholder="e.g., New York, NY"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

