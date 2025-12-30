/**
 * Hook for employee filtering logic
 */

import { useMemo } from 'react';
import { ROLE_CATEGORIES } from '@/utils/roleUtils';
import { UnifiedEmployee } from './useEmployees';

export const useEmployeeFilters = (
  employees: UnifiedEmployee[],
  selectedTab: string,
  searchTerm: string,
  roleFilter: string,
  departmentFilter: string,
  statusFilter: string
) => {
  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    // Tab filter
    if (selectedTab === 'active') {
      filtered = filtered.filter(emp => emp.is_active);
    } else if (selectedTab === 'trash') {
      filtered = filtered.filter(emp => !emp.is_active);
    } else if (selectedTab === 'admins') {
      filtered = filtered.filter(emp => emp.is_active && ['super_admin', 'admin'].includes(emp.role));
    } else if (selectedTab === 'managers') {
      filtered = filtered.filter(emp => emp.is_active && ROLE_CATEGORIES.management.includes(emp.role as any));
    }
    // "all" tab shows ALL employees regardless of status - no filter applied

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

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(emp => emp.role === roleFilter);
    }

    // Department filter - support both department name and department_id
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(emp => 
        emp.department_id === departmentFilter || 
        emp.department === departmentFilter
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(emp => emp.status === statusFilter);
    }

    return filtered;
  }, [employees, selectedTab, searchTerm, roleFilter, departmentFilter, statusFilter]);

  return filteredEmployees;
};

