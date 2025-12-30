/**
 * Hook for fetching project details
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { projectService, Project } from '@/services/api/project-service';

export const useProjectDetails = (projectId: string | undefined) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const data = await projectService.getProject(projectId, profile, user?.id);
      setProject(data);
    } catch (error: any) {
      console.error('Error loading project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load project",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, profile, user?.id, toast]);

  return {
    project,
    setProject,
    loading,
    loadProject,
  };
};

