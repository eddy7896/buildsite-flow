/**
 * Hook for project pipeline/Kanban view
 */

import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/database';
import { Project } from '../utils/projectUtils';
import { PIPELINE_STAGES } from '../utils/projectUtils';

export const useProjectPipeline = (
  projects: Project[],
  onProjectsUpdated: () => void
) => {
  const { toast } = useToast();
  const [draggedProject, setDraggedProject] = useState<string | null>(null);

  // Group projects by status
  const projectsByStatus = useMemo(() => {
    return PIPELINE_STAGES.reduce((acc, stage) => {
      acc[stage.status] = projects.filter(project => {
        const normalizedStatus = project.status === 'in_progress' ? 'in-progress' : 
                                project.status === 'on_hold' ? 'on-hold' : project.status;
        return normalizedStatus === stage.status;
      });
      return acc;
    }, {} as Record<string, Project[]>);
  }, [projects]);

  const handleProjectStatusChange = async (projectId: string, newStatus: string) => {
    try {
      const dbStatus = newStatus === 'in-progress' ? 'in_progress' : 
                      newStatus === 'on-hold' ? 'on_hold' : newStatus;

      const { data, error } = await db
        .from('projects')
        .update({ status: dbStatus })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Project status updated successfully',
      });

      onProjectsUpdated();
    } catch (error: any) {
      console.error('Error updating project status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update project status',
        variant: 'destructive',
      });
    }
  };

  const onDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedProject(projectId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', projectId);
    const dragElement = e.currentTarget as HTMLElement;
    if (dragElement) {
      dragElement.style.opacity = '0.5';
      dragElement.style.transform = 'scale(0.95) rotate(2deg)';
      dragElement.style.cursor = 'grabbing';
    }
  };

  const onDragEnd = (e: React.DragEvent) => {
    setDraggedProject(null);
    const dragElement = e.currentTarget as HTMLElement;
    if (dragElement) {
      dragElement.style.opacity = '1';
      dragElement.style.transform = 'scale(1) rotate(0deg)';
      dragElement.style.cursor = 'pointer';
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    const target = e.currentTarget as HTMLElement;
    const dropZone = target.querySelector('.pipeline-column') as HTMLElement;
    if (dropZone) {
      dropZone.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2', 'bg-blue-50/50');
      dropZone.style.transform = 'scale(1.01)';
    }
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    const dropZone = target.querySelector('.pipeline-column') as HTMLElement;
    if (dropZone) {
      dropZone.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2', 'bg-blue-50/50');
      dropZone.style.transform = 'scale(1)';
    }
  };

  const onDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    e.stopPropagation();
    const projectId = e.dataTransfer.getData('text/plain');
    
    const target = e.currentTarget as HTMLElement;
    const dropZone = target.querySelector('.pipeline-column') as HTMLElement;
    if (dropZone) {
      dropZone.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2', 'bg-blue-50/50');
      dropZone.style.transform = 'scale(1)';
    }

    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        const currentStatus = project.status === 'in_progress' ? 'in-progress' : 
                            project.status === 'on_hold' ? 'on-hold' : project.status;
        if (currentStatus !== newStatus) {
          handleProjectStatusChange(projectId, newStatus);
        }
      }
    }
    
    setDraggedProject(null);
  };

  return {
    projectsByStatus,
    draggedProject,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
  };
};

