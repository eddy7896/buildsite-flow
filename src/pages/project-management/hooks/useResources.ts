/**
 * Hook for fetching and managing resources
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { selectRecords } from '@/services/api/postgresql-service';
import { getAgencyId } from '@/utils/agencyUtils';
import { getEmployeesForAssignmentAuto } from '@/services/api/employee-selector-service';
import { projectService } from '@/services/api/project-service';
import { Resource } from '@/components/project-management/fragments/types';

export const useResources = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);

  const fetchResources = useCallback(async () => {
    try {
      const agencyId = await getAgencyId(profile, user?.id);
      
      if (!agencyId) return;
      
      const employeesData = await getEmployeesForAssignmentAuto(profile, user?.id);
      
      const employees: any[] = employeesData.map(emp => ({
        user_id: emp.user_id,
        display_name: emp.full_name,
        full_name: emp.full_name,
        role: emp.role || 'employee',
        is_fully_active: emp.is_active
      }));
      
      const userIds = employees.map((e: any) => e.user_id).filter(Boolean);
      
      const [employeeDetails, allTasks, allProjects] = await Promise.all([
        userIds.length > 0 
          ? selectRecords('employee_details', {
              where: { user_id: { operator: 'in', value: userIds }, agency_id: agencyId }
            })
          : Promise.resolve([]),
        projectService.getTasks({}, profile, user?.id),
        projectService.getProjects({}, profile, user?.id)
      ]);
      
      const employeeIds = employeeDetails.map((ed: any) => ed.id).filter(Boolean);
      const salaryMap = new Map();
      
      if (employeeIds.length > 0) {
        try {
          const salaryDetails = await selectRecords('employee_salary_details', {
            where: { employee_id: { operator: 'in', value: employeeIds }, agency_id: agencyId },
            orderBy: 'effective_date DESC'
          });
          
          const employeeIdToSalary = new Map();
          salaryDetails.forEach((s: any) => {
            if (!employeeIdToSalary.has(s.employee_id)) {
              employeeIdToSalary.set(s.employee_id, s);
            }
          });
          
          employeeDetails.forEach((ed: any) => {
            const salary = employeeIdToSalary.get(ed.id);
            if (salary && ed.user_id) {
              salaryMap.set(ed.user_id, salary);
            }
          });
        } catch (error) {
          console.warn('Could not fetch salary details:', error);
        }
      }
      
      const resourceMap = new Map();
      
      employees.forEach((emp: any) => {
        const userTasks = allTasks.filter(t => 
          t.assignee_id === emp.user_id || 
          t.assignments?.some((a: any) => a.user_id === emp.user_id)
        );
        
        const userProjects = allProjects.filter(p => 
          p.project_manager_id === emp.user_id ||
          p.account_manager_id === emp.user_id ||
          (p.assigned_team && Array.isArray(p.assigned_team) && p.assigned_team.includes(emp.user_id))
        );
        
        const totalActualHours = userTasks.reduce((sum, t) => sum + (Number(t.actual_hours) || 0), 0);
        const totalEstimatedHours = userTasks.reduce((sum, t) => sum + (Number(t.estimated_hours) || 0), 0);
        
        const standardMonthlyHours = 160;
        const utilization = standardMonthlyHours > 0 
          ? Math.min((totalEstimatedHours / standardMonthlyHours) * 100, 100)
          : 0;
        
        const salary = salaryMap.get(emp.user_id);
        let hourlyRate = 0;
        if (salary) {
          if (salary.hourly_rate) {
            hourlyRate = Number(salary.hourly_rate);
          } else if (salary.salary || salary.base_salary) {
            const monthlySalary = Number(salary.salary || salary.base_salary || 0);
            hourlyRate = monthlySalary > 0 ? monthlySalary / 160 : 0;
          }
        }
        
        const availability = Math.max(100 - utilization, 0);
        
        resourceMap.set(emp.user_id, {
          id: emp.user_id,
          name: emp.display_name || emp.full_name || 'Unknown User',
          role: emp.role || emp.position || 'Employee',
          hourly_rate: hourlyRate,
          availability: Math.round(availability),
          current_projects: userProjects.length,
          utilization: Math.round(utilization),
          total_hours: totalActualHours,
          estimated_hours: totalEstimatedHours
        });
      });
      
      setResources(Array.from(resourceMap.values()));
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load resources",
        variant: "destructive"
      });
    }
  }, [profile, user?.id, toast]);

  return {
    resources,
    fetchResources,
  };
};

