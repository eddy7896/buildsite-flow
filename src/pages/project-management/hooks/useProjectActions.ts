/**
 * Hook for project actions (delete, archive, duplicate, bulk operations)
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { projectService, Project, Task } from '@/services/api/project-service';

export const useProjectActions = (
  projects: Project[],
  tasks: Task[],
  onProjectsChange: () => void
) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);

  const handleDeleteProject = useCallback(async () => {
    if (!projectToDelete) return;
    
    const projectId = projectToDelete.id;
    const projectName = projectToDelete.name;
    const projectToRestore = { ...projectToDelete };
    
    const previousProjects = [...projects];
    setDeletingProjectId(projectId);
    setProjectToDelete(null);
    
    try {
      const projectTasks = tasks.filter(t => t.project_id === projectId);
      if (projectTasks.length > 0) {
        const hasConfirmed = window.confirm(
          `This project has ${projectTasks.length} associated task(s). ` +
          `Deleting this project will remove the project reference from these tasks. Continue?`
        );
        if (!hasConfirmed) {
          setDeletingProjectId(null);
          return;
        }
      }
      
      await projectService.deleteProject(projectId, profile, user?.id);
      
      toast({
        title: "Success",
        description: `Project "${projectName}" deleted successfully`,
      });
      
      onProjectsChange();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingProjectId(null);
    }
  }, [projectToDelete, projects, tasks, profile, user?.id, onProjectsChange, toast]);

  const handleArchiveProject = useCallback(async (project: Project) => {
    try {
      await projectService.updateProject(project.id, { status: 'archived' as any }, profile, user?.id);
      toast({
        title: 'Success',
        description: `Project "${project.name}" has been archived`,
      });
      onProjectsChange();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to archive project',
        variant: 'destructive'
      });
    }
  }, [profile, user?.id, onProjectsChange, toast]);

  const handleDuplicateProject = useCallback(async (project: Project) => {
    try {
      const newProject = {
        ...project,
        name: `${project.name} (Copy)`,
        status: 'planning' as const,
        progress: 0,
        actual_cost: 0,
      };
      delete (newProject as any).id;
      delete (newProject as any).created_at;
      delete (newProject as any).updated_at;
      
      await projectService.createProject(newProject, profile, user?.id);
      toast({
        title: 'Success',
        description: `Project "${project.name}" duplicated successfully`,
      });
      onProjectsChange();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to duplicate project',
        variant: 'destructive'
      });
    }
  }, [profile, user?.id, onProjectsChange, toast]);

  const handleBulkStatusChange = useCallback(async (newStatus: string) => {
    try {
      await Promise.all(
        Array.from(selectedProjectIds).map(projectId => 
          projectService.updateProject(projectId, { status: newStatus as any }, profile, user?.id)
        )
      );
      toast({
        title: 'Success',
        description: `${selectedProjectIds.size} project(s) updated`,
      });
      setSelectedProjectIds(new Set());
      setBulkActionOpen(false);
      onProjectsChange();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update projects',
        variant: 'destructive'
      });
    }
  }, [selectedProjectIds, profile, user?.id, onProjectsChange, toast]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedProjectIds.size === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedProjectIds.size} project(s)? This action cannot be undone.`
    );
    if (!confirmed) return;
    
    try {
      await Promise.all(
        Array.from(selectedProjectIds).map(projectId => 
          projectService.deleteProject(projectId, profile, user?.id)
        )
      );
      toast({
        title: 'Success',
        description: `${selectedProjectIds.size} project(s) deleted`,
      });
      setSelectedProjectIds(new Set());
      setBulkActionOpen(false);
      onProjectsChange();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete projects',
        variant: 'destructive'
      });
    }
  }, [selectedProjectIds, profile, user?.id, onProjectsChange, toast]);

  const toggleProjectSelection = useCallback((projectId: string) => {
    setSelectedProjectIds(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }, []);

  const selectAllProjects = useCallback((projectIds: string[]) => {
    setSelectedProjectIds(new Set(projectIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedProjectIds(new Set());
  }, []);

  return {
    projectToDelete,
    setProjectToDelete,
    deletingProjectId,
    selectedProjectIds,
    bulkActionOpen,
    setBulkActionOpen,
    handleDeleteProject,
    handleArchiveProject,
    handleDuplicateProject,
    handleBulkStatusChange,
    handleBulkDelete,
    toggleProjectSelection,
    selectAllProjects,
    clearSelection,
  };
};

