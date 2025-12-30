/**
 * Employee permission utilities
 * Helper functions for checking employee access permissions
 */

import { canAccessEmployeeData, canManageRole, AppRole } from '@/utils/roleUtils';

/**
 * Check if user can view employee
 */
export const canViewEmployee = (
  employee: any,
  user: any,
  userRole: string | undefined,
  managerDepartment?: string
): boolean => {
  if (!user || !userRole) return false;
  // Everyone can see their own record
  if (employee.user_id === user.id) return true;
  return canAccessEmployeeData(userRole as AppRole, managerDepartment, employee.department);
};

/**
 * Check if user can manage employee
 */
export const canManageEmployee = (
  employee: any,
  user: any,
  userRole: string | undefined,
  managerDepartment?: string
): boolean => {
  if (!user || !userRole) return false;
  // Cannot manage yourself from this screen
  if (employee.user_id === user.id) return false;
  const canAccess = canAccessEmployeeData(
    userRole as AppRole,
    managerDepartment,
    employee.department
  );
  if (!canAccess) return false;
  return canManageRole(userRole as AppRole, employee.role as AppRole);
};

