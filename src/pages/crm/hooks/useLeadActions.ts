/**
 * Hook for lead actions (create, edit, delete, convert)
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/database';

export const useLeadActions = (onLeadsChange: () => void) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [leadFormOpen, setLeadFormOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<any>(null);

  const handleNewLead = useCallback(() => {
    setSelectedLead(null);
    setLeadFormOpen(true);
  }, []);

  const handleEditLead = useCallback((lead: any) => {
    setSelectedLead(lead);
    setLeadFormOpen(true);
  }, []);

  const handleDeleteLead = useCallback((lead: any) => {
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  }, []);

  const handleLeadSaved = useCallback(() => {
    onLeadsChange();
    setLeadFormOpen(false);
    setSelectedLead(null);
  }, [onLeadsChange]);

  const handleLeadDeleted = useCallback(() => {
    onLeadsChange();
    setDeleteDialogOpen(false);
    setLeadToDelete(null);
  }, [onLeadsChange]);

  const handleConvertToClient = useCallback((lead: any) => {
    setLeadToConvert(lead);
    setConvertDialogOpen(true);
  }, []);

  const handleLeadConverted = useCallback(() => {
    onLeadsChange();
    setLeadToConvert(null);
    setConvertDialogOpen(false);
  }, [onLeadsChange]);

  const handleCreateQuotation = useCallback(async (lead: any) => {
    try {
      navigate('/quotations', { 
        state: { 
          fromLead: true, 
          leadData: {
            company_name: lead.company_name,
            contact_name: lead.contact_name,
            email: lead.email,
            phone: lead.phone,
            estimated_value: lead.estimated_value,
            notes: lead.notes,
          }
        } 
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create quotation',
        variant: 'destructive',
      });
    }
  }, [navigate, toast]);

  return {
    selectedLead,
    setSelectedLead,
    leadFormOpen,
    setLeadFormOpen,
    convertDialogOpen,
    setConvertDialogOpen,
    leadToConvert,
    setLeadToConvert,
    deleteDialogOpen,
    setDeleteDialogOpen,
    leadToDelete,
    setLeadToDelete,
    handleNewLead,
    handleEditLead,
    handleDeleteLead,
    handleLeadSaved,
    handleLeadDeleted,
    handleConvertToClient,
    handleLeadConverted,
    handleCreateQuotation,
  };
};

