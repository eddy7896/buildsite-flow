/**
 * Hook for projects data fetching
 */

import { useState } from 'react';
import { projectService } from '@/services/api/project-service';
import { logError } from '@/utils/consoleLogger';

export const useProjects = (agencyId: string | null, profile: any, userId: string | undefined) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async (agencyIdParam?: string | null) => {
    const effectiveAgencyId = agencyIdParam || agencyId;
    setLoading(true);
    try {
      const projectsData = await projectService.getProjects({}, profile, userId);
      
      const projectsWithFinancials = await Promise.all(
        projectsData.map(async (project: any) => {
          try {
            const projectWithFinancials = await projectService.getProjectWithFinancials(project.id, profile, userId);
            return projectWithFinancials || project;
          } catch (error) {
            console.error(`Error fetching financials for project ${project.id}:`, error);
            return project;
          }
        })
      );
      
      setProjects(projectsWithFinancials);
    } catch (error: any) {
      logError('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    projects,
    loading,
    fetchProjects,
  };
};

