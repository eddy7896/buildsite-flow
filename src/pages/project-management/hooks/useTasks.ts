/**
 * Hook for fetching and managing tasks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { projectService, Task } from '@/services/api/project-service';

export const useTasks = (
  statusFilter: string,
  projectFilter: string,
  searchTerm: string
) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchTasks = useCallback(async (abortSignal?: AbortSignal) => {
    try {
      const filters: any = {};
      if (statusFilter !== 'all') {
        filters.status = [statusFilter];
      }
      if (projectFilter !== 'all') {
        filters.project_id = projectFilter;
      }
      if (debouncedSearchTerm) {
        filters.search = debouncedSearchTerm.trim().substring(0, 200);
      }
      
      const data = await projectService.getTasks(filters, profile, user?.id);
      
      if (abortSignal?.aborted) return;
      
      setTasks(data);
    } catch (error: any) {
      if (abortSignal?.aborted) return;
      
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load tasks",
        variant: "destructive"
      });
    }
  }, [statusFilter, projectFilter, debouncedSearchTerm, profile, user?.id, toast]);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    fetchTasks(abortController.signal);
    
    return () => {
      abortController.abort();
    };
  }, [fetchTasks]);

  return {
    tasks,
    setTasks,
    fetchTasks,
  };
};

