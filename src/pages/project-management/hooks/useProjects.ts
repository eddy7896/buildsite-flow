/**
 * Hook for fetching and managing projects
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { projectService, Project } from '@/services/api/project-service';

export const useProjects = (
  statusFilter: string,
  priorityFilter: string,
  searchTerm: string
) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [fetchingProjects, setFetchingProjects] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchProjects = useCallback(async (abortSignal?: AbortSignal) => {
    try {
      setFetchingProjects(true);
      const filters: any = {};
      if (statusFilter !== 'all') {
        filters.status = [statusFilter];
      }
      if (priorityFilter !== 'all') {
        filters.priority = [priorityFilter];
      }
      if (debouncedSearchTerm) {
        filters.search = debouncedSearchTerm.trim().substring(0, 200);
      }
      
      const data = await projectService.getProjects(filters, profile, user?.id);
      
      if (abortSignal?.aborted) return;
      
      setProjects(data);
    } catch (error: any) {
      if (abortSignal?.aborted) return;
      
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setFetchingProjects(false);
    }
  }, [statusFilter, priorityFilter, debouncedSearchTerm, profile, user?.id, toast]);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    fetchProjects(abortController.signal);
    
    return () => {
      abortController.abort();
    };
  }, [fetchProjects]);

  return {
    projects,
    setProjects,
    fetchingProjects,
    fetchProjects,
  };
};

