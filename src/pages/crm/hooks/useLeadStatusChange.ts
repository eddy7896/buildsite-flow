/**
 * Hook for handling lead status changes (drag and drop)
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/database';

export const useLeadStatusChange = (onLeadsChange: () => void) => {
  const { toast } = useToast();
  const [draggedLead, setDraggedLead] = useState<string | null>(null);

  const handleLeadStatusChange = useCallback(async (leadId: string, newStatus: string) => {
    try {
      const { data, error } = await db
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lead status updated successfully',
      });

      onLeadsChange();
    } catch (error: any) {
      console.error('Error updating lead status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update lead status',
        variant: 'destructive',
      });
    }
  }, [toast, onLeadsChange]);

  const onDragStart = useCallback((e: React.DragEvent, leadId: string) => {
    setDraggedLead(leadId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', leadId);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, []);

  const onDragEnd = useCallback((e: React.DragEvent) => {
    setDraggedLead(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    const target = e.currentTarget as HTMLElement;
    const dropZone = target.querySelector('.bg-gray-50') as HTMLElement;
    if (dropZone) {
      dropZone.classList.add('border-blue-500', 'bg-blue-50');
    }
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    const dropZone = target.querySelector('.bg-gray-50') as HTMLElement;
    if (dropZone) {
      dropZone.classList.remove('border-blue-500', 'bg-blue-50');
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent, newStatus: string, leads: any[]) => {
    e.preventDefault();
    e.stopPropagation();
    const leadId = e.dataTransfer.getData('text/plain');
    
    const target = e.currentTarget as HTMLElement;
    const dropZone = target.querySelector('.bg-gray-50') as HTMLElement;
    if (dropZone) {
      dropZone.classList.remove('border-blue-500', 'bg-blue-50');
    }

    if (leadId) {
      const lead = leads.find(l => l.id === leadId);
      if (lead && lead.status !== newStatus) {
        handleLeadStatusChange(leadId, newStatus);
      }
    }
    
    setDraggedLead(null);
  }, [handleLeadStatusChange]);

  return {
    draggedLead,
    handleLeadStatusChange,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
  };
};

