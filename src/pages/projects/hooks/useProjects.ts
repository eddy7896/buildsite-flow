/**
 * Hook for project data fetching
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'react-router-dom';
import { db } from '@/lib/database';
import { projectService } from '@/services/api/project-service';
import { Project } from '../utils/projectUtils';

export const useProjects = (
  urlDepartmentId?: string | null,
  urlEmployeeId?: string | null,
  legacyDepartmentId?: string | null,
  clientFilterId?: string | null
) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async (
    statusFilter: string,
    priorityFilter: string,
    clientFilter: string,
    managerFilter: string,
    departmentFilter: string,
    searchTerm: string
  ) => {
    try {
      setLoading(true);
      
      const filters: any = {};
      if (statusFilter !== 'all') {
        filters.status = [statusFilter === 'in-progress' ? 'in_progress' : statusFilter === 'on-hold' ? 'on_hold' : statusFilter];
      }
      if (priorityFilter !== 'all') {
        filters.priority = [priorityFilter];
      }
      if (clientFilter !== 'all') {
        filters.client_id = clientFilter;
      }
      if (managerFilter !== 'all') {
        filters.project_manager_id = managerFilter;
      }
      if (searchTerm) {
        filters.search = searchTerm;
      }

      const projectsData = await projectService.getProjects(filters, profile, user?.id);

      const deptId = urlDepartmentId || legacyDepartmentId;
      let filteredData = projectsData;

      if (deptId) {
        const { data: assignments } = await db
          .from('team_assignments')
          .select('user_id, department_id')
          .eq('department_id', deptId)
          .eq('is_active', true);
        
        const userDepartmentMap = new Map<string, string>();
        if (assignments) {
          assignments.forEach((ta: any) => {
            if (ta.user_id) {
              userDepartmentMap.set(ta.user_id, ta.department_id);
            }
          });
        }

        filteredData = filteredData.filter((project: Project) => {
          if (!project.assigned_team) return false;
          let teamMembers: any[] = [];
          try {
            teamMembers = typeof project.assigned_team === 'string' 
              ? JSON.parse(project.assigned_team) 
              : project.assigned_team;
          } catch {
            return false;
          }
          return teamMembers.some((member: any) => {
            const userId = member.user_id || member.id;
            return userId && userDepartmentMap.has(userId);
          });
        });
      }
      
      if (urlEmployeeId) {
        filteredData = filteredData.filter((project: Project) => {
          if (!project.assigned_team) return false;
          let teamMembers: any[] = [];
          try {
            teamMembers = typeof project.assigned_team === 'string' 
              ? JSON.parse(project.assigned_team) 
              : project.assigned_team;
          } catch {
            return false;
          }
          return teamMembers.some((member: any) => {
            const userId = member.user_id || member.id;
            return userId === urlEmployeeId;
          });
        });
      }
      
      if (clientFilterId) {
        filteredData = filteredData.filter((p: Project) => p.client_id === clientFilterId);
      }

      if (departmentFilter !== 'all') {
        filteredData = filteredData.filter((project: Project) => {
          if (!project.departments) return false;
          const deptArray = Array.isArray(project.departments) ? project.departments : 
                           typeof project.departments === 'string' ? JSON.parse(project.departments || '[]') : [];
          return deptArray.includes(departmentFilter);
        });
      }

      setProjects(filteredData);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch projects. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [urlDepartmentId, urlEmployeeId, legacyDepartmentId, profile, user?.id, toast]);

  return {
    projects,
    loading,
    fetchProjects,
    setProjects,
  };
};

