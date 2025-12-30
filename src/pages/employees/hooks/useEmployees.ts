/**
 * Hook for employee data fetching
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { selectRecords } from '@/services/api/postgresql-service';

export interface UnifiedEmployee {
  id: string;
  user_id: string;
  employee_id?: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department?: string;
  department_id?: string;
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

export const useEmployees = (urlDepartmentId?: string | null) => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<UnifiedEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      // Use unified_employees view for single query instead of joining 4 tables
      const unifiedData = await selectRecords('unified_employees', {
        orderBy: 'display_name ASC'
      });

      // Fetch team assignments to get department_id for each employee
      const teamAssignments = await selectRecords('team_assignments', {
        filters: [
          { column: 'is_active', operator: 'eq', value: true }
        ]
      });

      // Create a map of user_id to department_id
      const userDepartmentMap = new Map<string, string>();
      teamAssignments.forEach((ta: any) => {
        if (ta.user_id && ta.department_id) {
          userDepartmentMap.set(ta.user_id, ta.department_id);
        }
      });

      // Transform view data to UnifiedEmployee interface
      const unifiedEmployees: UnifiedEmployee[] = unifiedData.map((emp: any) => {
        const departmentId = userDepartmentMap.get(emp.user_id);
        return {
          id: emp.employee_detail_id || emp.profile_id || emp.user_id,
          user_id: emp.user_id,
          employee_id: emp.employee_id,
          full_name: emp.display_name || emp.full_name_computed || emp.full_name || 'Unknown User',
          first_name: emp.first_name || emp.full_name?.split(' ')[0] || '',
          last_name: emp.last_name || emp.full_name?.split(' ').slice(1).join(' ') || '',
          email: emp.email || '',
          phone: emp.phone,
          department: emp.department,
          department_id: departmentId,
          position: emp.position,
          role: emp.role || 'employee',
          status: emp.is_fully_active ? 'active' : 'inactive',
          is_active: emp.is_fully_active,
          hire_date: emp.hire_date,
          employment_type: emp.employment_type,
          work_location: emp.work_location,
          avatar_url: emp.avatar_url,
          emergency_contact_name: emp.emergency_contact_name,
          emergency_contact_phone: emp.emergency_contact_phone,
        };
      });

      setEmployees(unifiedEmployees);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      
      // Fallback to old method if view doesn't exist yet
      if (error.message?.includes('relation') && error.message?.includes('unified_employees')) {
        console.warn('unified_employees view not found, falling back to old method');
        toast({
          title: "Warning",
          description: "Database view not found. Please run migration: 03_create_unified_employees_view.sql",
          variant: "default",
        });
        
        await fetchEmployeesFallback();
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch employees. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Fallback method using old approach
  const fetchEmployeesFallback = async () => {
    try {
      const profilesData = await selectRecords('profiles', {
        orderBy: 'full_name ASC'
      });

      const rolesData = await selectRecords('user_roles', {
        select: 'user_id, role'
      });

      const employeeDetailsData = await selectRecords('employee_details', {
        select: 'id, user_id, employee_id, first_name, last_name, employment_type, work_location, is_active, emergency_contact_name, emergency_contact_phone'
      });

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
      console.error('Error in fallback fetch:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [urlDepartmentId]);

  return {
    employees,
    loading,
    fetchEmployees,
    setEmployees,
  };
};

