/**
 * Hook for fetching and managing activities
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/database';

export const useActivities = () => {
  const { toast } = useToast();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      let activitiesData: any[] = [];
      let activitiesError: any = null;

      try {
        const result = await db
          .from('crm_activities')
          .select('*')
          .order('created_at', { ascending: false });
        activitiesData = result.data || [];
      } catch (error: any) {
        activitiesError = error;
        if (error.message?.includes('due_date') || error.message?.includes('does not exist')) {
          try {
            const retryResult = await db
              .from('crm_activities')
              .select('*')
              .order('created_at', { ascending: false });
            activitiesData = retryResult.data || [];
            activitiesError = null;
          } catch (retryError: any) {
            throw retryError;
          }
        } else {
          throw error;
        }
      }

      if (activitiesError) throw activitiesError;

      // Fetch leads separately and map them
      const leadIds = activitiesData?.filter(a => a.lead_id).map(a => a.lead_id) || [];
      let leadsMap: Record<string, any> = {};
      
      if (leadIds.length > 0) {
        const { data: leadsData, error: leadsError } = await db
          .from('leads')
          .select('id, company_name, lead_number')
          .in('id', leadIds);

        if (!leadsError && leadsData) {
          leadsMap = leadsData.reduce((acc, lead) => {
            acc[lead.id] = lead;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Map activities with lead data and sort properly
      const activitiesWithLeads = activitiesData?.map(activity => ({
        ...activity,
        leads: activity.lead_id ? leadsMap[activity.lead_id] : null
      })) || [];

      // Sort: pending first, then by due_date (if it exists), then by created_at
      activitiesWithLeads.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });

      setActivities(activitiesWithLeads);
    } catch (error: any) {
      console.error('Error fetching activities:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch activities',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    activities,
    setActivities,
    loading,
    fetchActivities,
  };
};

