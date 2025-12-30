/**
 * Hook for drag and drop functionality
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { projectService, Project } from '@/services/api/project-service';

export const useDragAndDrop = (
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  onProjectsChange: () => void
) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, projectId: string) => {
    setDraggedProjectId(projectId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', projectId);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDraggedProjectId(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    e.stopPropagation();
    const projectId = e.dataTransfer.getData('text/plain');
    
    if (!projectId) return;
    
    const project = projects.find(p => p.id === projectId);
    if (!project || project.status === newStatus) {
      setDraggedProjectId(null);
      return;
    }
    
    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, status: newStatus as any } : p
    ));
    
    try {
      await projectService.updateProject(projectId, { status: newStatus as any }, profile, user?.id);
      toast({
        title: 'Success',
        description: `Project status updated to ${newStatus.replace('_', ' ')}`,
      });
      onProjectsChange();
    } catch (error: any) {
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, status: project.status } : p
      ));
      toast({
        title: 'Error',
        description: error.message || 'Failed to update project status',
        variant: 'destructive'
      });
    } finally {
      setDraggedProjectId(null);
    }
  }, [projects, setProjects, profile, user?.id, onProjectsChange, toast]);

  return {
    draggedProjectId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
  };
};

