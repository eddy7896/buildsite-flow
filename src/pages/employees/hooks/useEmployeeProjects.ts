/**
 * Hook for employee project integration
 */

import { useState } from 'react';
import { projectService } from '@/services/api/project-service';

export const useEmployeeProjects = (profile: any, userId: string | undefined) => {
  const [employeeProjects, setEmployeeProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadEmployeeProjects = async (employeeId: string) => {
    setLoading(true);
    try {
      const allProjects = await projectService.getProjects({}, profile, userId);
      
      const employeeProjects = allProjects.filter((project: any) => {
        const inTeam = project.assigned_team && Array.isArray(project.assigned_team) && 
          project.assigned_team.some((member: any) => {
            const memberId = typeof member === 'string' ? member : member.user_id || member.id || String(member);
            return memberId === employeeId;
          });
        
        const isManager = project.project_manager_id === employeeId || project.account_manager_id === employeeId;
        
        return inTeam || isManager;
      });
      
      setEmployeeProjects(employeeProjects);
    } catch (error) {
      console.error('Error loading employee projects:', error);
      setEmployeeProjects([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    employeeProjects,
    loading,
    loadEmployeeProjects,
  };
};

