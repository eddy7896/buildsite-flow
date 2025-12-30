/**
 * Hook for activity actions (create, edit, delete)
 */

import { useState, useCallback } from 'react';

export const useActivityActions = (onActivitiesChange: () => void) => {
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<any>(null);

  const handleNewActivity = useCallback((leadId?: string) => {
    setSelectedActivity(leadId ? { lead_id: leadId } : null);
    setActivityFormOpen(true);
  }, []);

  const handleEditActivity = useCallback((activity: any) => {
    setSelectedActivity(activity);
    setActivityFormOpen(true);
  }, []);

  const handleDeleteActivity = useCallback((activity: any) => {
    setActivityToDelete(activity);
    setDeleteDialogOpen(true);
  }, []);

  const handleActivitySaved = useCallback(() => {
    onActivitiesChange();
    setActivityFormOpen(false);
    setSelectedActivity(null);
  }, [onActivitiesChange]);

  const handleActivityDeleted = useCallback(() => {
    onActivitiesChange();
    setDeleteDialogOpen(false);
    setActivityToDelete(null);
  }, [onActivitiesChange]);

  return {
    selectedActivity,
    setSelectedActivity,
    activityFormOpen,
    setActivityFormOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    activityToDelete,
    setActivityToDelete,
    handleNewActivity,
    handleEditActivity,
    handleDeleteActivity,
    handleActivitySaved,
    handleActivityDeleted,
  };
};

