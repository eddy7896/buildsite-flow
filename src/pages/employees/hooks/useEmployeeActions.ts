/**
 * Hook for employee CRUD operations
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { selectRecords, updateRecord, deleteRecord, insertRecord } from '@/services/api/postgresql-service';
import { generateUUID } from '@/lib/uuid';
import { getAgencyId } from '@/utils/agencyUtils';
import { normalizeEmploymentType } from '../utils/employeeUtils';

export const useEmployeeActions = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [saving, setSaving] = useState(false);

  const saveEmployee = async (
    selectedEmployee: any,
    editForm: any,
    onSuccess?: () => void
  ) => {
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
      const wasInactive = !selectedEmployee.is_active;
      const isNowActive = editForm.is_active;
      const statusChangedToActive = wasInactive && isNowActive;

      // Update all three tables sequentially
      const existingProfiles = await selectRecords('profiles', {
        filters: [{ column: 'user_id', operator: 'eq', value: selectedEmployee.user_id }]
      });

      if (existingProfiles.length > 0) {
        await updateRecord('profiles', {
          full_name: editForm.full_name,
          phone: editForm.phone,
          department: editForm.department,
          position: editForm.position,
          is_active: editForm.is_active,
        }, { user_id: selectedEmployee.user_id }, user.id);
      } else {
        const agencyId = await getAgencyId(profile, user?.id);
        await insertRecord('profiles', {
          id: generateUUID(),
          user_id: selectedEmployee.user_id,
          agency_id: agencyId || '00000000-0000-0000-0000-000000000000',
          full_name: editForm.full_name,
          phone: editForm.phone,
          department: editForm.department,
          position: editForm.position,
          is_active: editForm.is_active,
        }, user.id);
      }

      await updateRecord('users', {
        is_active: editForm.is_active,
      }, { id: selectedEmployee.user_id }, user.id);

      const employeeDetails = await selectRecords('employee_details', {
        filters: [{ column: 'user_id', operator: 'eq', value: selectedEmployee.user_id }]
      });

      if (employeeDetails.length > 0) {
        const nameParts = (editForm.full_name || '').trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        const normalizedEmploymentType = normalizeEmploymentType(editForm.employment_type);
        
        await updateRecord('employee_details', {
          first_name: firstName,
          last_name: lastName,
          employment_type: normalizedEmploymentType,
          work_location: editForm.work_location,
          is_active: editForm.is_active,
        }, { user_id: selectedEmployee.user_id }, user.id);
      }

      toast({
        title: "Success",
        description: statusChangedToActive 
          ? "Employee reactivated successfully" 
          : "Employee updated successfully",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast({
        title: "Error",
        description: error.message || error.detail || "Failed to update employee. Please check console for details.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteEmployee = async (
    selectedEmployee: any,
    onSuccess?: () => void
  ) => {
    if (!selectedEmployee || !user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to delete employees",
        variant: "destructive",
      });
      return;
    }

    try {
      const errors: string[] = [];
      let successCount = 0;

      // Soft delete employee_details
      try {
        const employeeDetails = await selectRecords('employee_details', {
          filters: [{ column: 'user_id', operator: 'eq', value: selectedEmployee.user_id }]
        });

        if (employeeDetails.length > 0) {
          if (employeeDetails[0].is_active !== false) {
            await updateRecord('employee_details', {
              is_active: false
            }, { id: employeeDetails[0].id }, user.id);
            successCount++;
          } else {
            successCount++;
          }
        }
      } catch (error: any) {
        console.error('Error deleting employee_details:', error);
        errors.push(`Employee details: ${error.message || 'Failed to delete'}`);
      }

      // Soft delete profile
      try {
        const existingProfiles = await selectRecords('profiles', {
          filters: [{ column: 'user_id', operator: 'eq', value: selectedEmployee.user_id }]
        });

        if (existingProfiles.length > 0) {
          if (existingProfiles[0].is_active !== false) {
            await updateRecord('profiles', {
              is_active: false
            }, { user_id: selectedEmployee.user_id }, user.id);
            successCount++;
          } else {
            successCount++;
          }
        }
      } catch (error: any) {
        console.error('Error deleting profile:', error);
        errors.push(`Profile: ${error.message || 'Failed to delete'}`);
      }

      // Soft delete user
      try {
        const existingUsers = await selectRecords('users', {
          filters: [{ column: 'id', operator: 'eq', value: selectedEmployee.user_id }]
        });

        if (existingUsers.length > 0) {
          if (existingUsers[0].is_active !== false) {
            await updateRecord('users', {
              is_active: false
            }, { id: selectedEmployee.user_id }, user.id);
            successCount++;
          } else {
            successCount++;
          }
        } else {
          errors.push('User record not found');
        }
      } catch (error: any) {
        console.error('Error deleting user:', error);
        errors.push(`User: ${error.message || 'Failed to delete'}`);
      }

      // Verify deletion
      let verificationFailed = false;
      try {
        const verifyData = await selectRecords('unified_employees', {
          filters: [{ column: 'user_id', operator: 'eq', value: selectedEmployee.user_id }]
        });
        
        if (verifyData.length > 0 && verifyData[0].is_fully_active === true) {
          verificationFailed = true;
          errors.push('Verification failed: Employee still appears as active in view');
        }
      } catch (verifyError: any) {
        console.error('Error verifying deletion:', verifyError);
      }

      if (errors.length > 0 && successCount === 0) {
        toast({
          title: "Error",
          description: `Failed to delete employee: ${errors.join('; ')}`,
          variant: "destructive",
        });
      } else if (errors.length > 0 || verificationFailed) {
        toast({
          title: verificationFailed ? "Warning" : "Partial Success",
          description: verificationFailed 
            ? `Employee marked as deleted but may still appear. Please refresh the page.`
            : `Employee partially deleted. Some errors: ${errors.join('; ')}`,
          variant: "default",
        });
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: "Success",
          description: "Employee deleted successfully",
        });
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: error.message || error.detail || "Failed to delete employee. Please check console for details.",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (
    selectedUser: any,
    onSuccess?: () => void
  ) => {
    if (!selectedUser || !user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to delete users",
        variant: "destructive",
      });
      return;
    }

    try {
      let wasAlreadyInactive = false;
      try {
        const checkData = await selectRecords('unified_employees', {
          filters: [{ column: 'user_id', operator: 'eq', value: selectedUser.user_id }]
        });
        if (checkData.length > 0 && checkData[0].is_fully_active === false) {
          wasAlreadyInactive = true;
        }
      } catch (checkError) {
        // Ignore check errors
      }

      const errors: string[] = [];
      let successCount = 0;
      let actuallyUpdated = 0;

      // Soft delete profile
      try {
        const existingProfiles = await selectRecords('profiles', {
          filters: [{ column: 'user_id', operator: 'eq', value: selectedUser.user_id }]
        });

        if (existingProfiles.length > 0) {
          if (existingProfiles[0].is_active !== false) {
            await updateRecord('profiles', {
              is_active: false
            }, { user_id: selectedUser.user_id }, user.id);
            successCount++;
            actuallyUpdated++;
          } else {
            successCount++;
          }
        }
      } catch (error: any) {
        console.error('Error deleting profile:', error);
        errors.push(`Profile: ${error.message || 'Failed to delete'}`);
      }

      // Soft delete user
      try {
        const existingUsers = await selectRecords('users', {
          filters: [{ column: 'id', operator: 'eq', value: selectedUser.user_id }]
        });

        if (existingUsers.length > 0) {
          if (existingUsers[0].is_active !== false) {
            await updateRecord('users', {
              is_active: false
            }, { id: selectedUser.user_id }, user.id);
            successCount++;
            actuallyUpdated++;
          } else {
            successCount++;
          }
        } else {
          errors.push('User record not found');
        }
      } catch (error: any) {
        console.error('Error deleting user:', error);
        errors.push(`User: ${error.message || 'Failed to delete'}`);
      }

      // Soft delete employee_details if exists
      try {
        const employeeDetails = await selectRecords('employee_details', {
          filters: [{ column: 'user_id', operator: 'eq', value: selectedUser.user_id }]
        });

        if (employeeDetails.length > 0) {
          if (employeeDetails[0].is_active !== false) {
            await updateRecord('employee_details', {
              is_active: false
            }, { id: employeeDetails[0].id }, user.id);
            successCount++;
            actuallyUpdated++;
          } else {
            successCount++;
          }
        }
      } catch (error: any) {
        console.error('Error deleting employee_details:', error);
        errors.push(`Employee details: ${error.message || 'Failed to delete'}`);
      }

      // Verify deletion
      let verificationFailed = false;
      try {
        const verifyData = await selectRecords('unified_employees', {
          filters: [{ column: 'user_id', operator: 'eq', value: selectedUser.user_id }]
        });
        
        if (verifyData.length > 0 && verifyData[0].is_fully_active === true) {
          verificationFailed = true;
          errors.push('Verification failed: User still appears as active in view');
        }
      } catch (verifyError: any) {
        console.error('Error verifying user deletion:', verifyError);
      }

      if (errors.length > 0 && successCount === 0) {
        toast({
          title: "Error",
          description: `Failed to delete user: ${errors.join('; ')}`,
          variant: "destructive",
        });
      } else if (wasAlreadyInactive && actuallyUpdated === 0) {
        toast({
          title: "Already Deleted",
          description: "This user is already deleted. They appear in the 'Trash' tab.",
          variant: "default",
        });
        if (onSuccess) onSuccess();
      } else if (errors.length > 0 || verificationFailed) {
        toast({
          title: verificationFailed ? "Warning" : "Partial Success",
          description: verificationFailed 
            ? `User marked as deleted but may still appear. Please refresh the page.`
            : `User partially deleted. Some errors: ${errors.join('; ')}`,
          variant: "default",
        });
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: "Success",
          description: "User deleted successfully. They will now appear in the 'Trash' tab.",
        });
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user. Please check console for details.",
        variant: "destructive",
      });
    }
  };

  return {
    saving,
    saveEmployee,
    deleteEmployee,
    deleteUser,
  };
};

