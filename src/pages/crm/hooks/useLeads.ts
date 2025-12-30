/**
 * Hook for fetching and managing leads
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/database';
import { normalizeLead } from '../utils/crmUtils';

export const useLeads = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await db
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const normalizedLeads = (data || []).map(normalizeLead);
      setLeads(normalizedLeads);
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch leads',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    leads,
    setLeads,
    loading,
    fetchLeads,
  };
};

