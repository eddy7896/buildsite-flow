/**
 * Hook for fetching project tasks
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { projectService, Task } from '@/services/api/project-service';

export const useProjectTasks = (projectId: string | undefined) => {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  const loadTasks = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const data = await projectService.getTasks({ project_id: projectId }, profile, user?.id);
      setTasks(data);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
    }
  }, [projectId, profile, user?.id]);

  return {
    tasks,
    setTasks,
    loadTasks,
  };
};

