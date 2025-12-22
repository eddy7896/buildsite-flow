/**
 * Agency Pages Hook
 * Manages page assignments for agencies
 */

import { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '@/config/api';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { AgencyPageAssignment, AgencyPageRequest } from '@/types/pageCatalog';

export function useAgencyPages(agencyId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pages, setPages] = useState<AgencyPageAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCost, setTotalCost] = useState(0);

  const fetchAgencyPages = useCallback(async () => {
    if (!user) return;
    if (!agencyId && !user.agencyId) return;

    const targetAgencyId = agencyId || user.agencyId;
    if (!targetAgencyId) return;

    setLoading(true);
    try {
      // Determine endpoint based on whether we're fetching for current agency or another
      const endpoint = agencyId 
        ? `/system/page-catalog/agencies/${agencyId}/pages`
        : `/system/page-catalog/agencies/me/pages`;

      const response = await fetch(`${getApiBaseUrl()}/api${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch agency pages');
      }

      const data = await response.json();
      if (data.success) {
        setPages(data.data);
        if (data.summary) {
          setTotalCost(data.summary.total_cost || 0);
        } else {
          // Calculate total cost from pages
          const cost = data.data.reduce((sum: number, page: AgencyPageAssignment) => 
            sum + (page.final_cost || 0), 0);
          setTotalCost(cost);
        }
      }
    } catch (error) {
      console.error('Error fetching agency pages:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch agency pages',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, agencyId, toast]);

  useEffect(() => {
    fetchAgencyPages();
  }, [fetchAgencyPages]);

  const assignPages = useCallback(async (pageIds: string[], costOverrides?: Record<string, number>) => {
    if (!user) return;
    if (!agencyId && !user.agencyId) return;

    const targetAgencyId = agencyId || user.agencyId;
    if (!targetAgencyId) return;

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/system/page-catalog/agencies/${targetAgencyId}/pages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            page_ids: pageIds,
            cost_overrides: costOverrides || {}
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to assign pages');
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: data.message || 'Pages assigned successfully'
        });
        await fetchAgencyPages();
        return data.data;
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign pages',
        variant: 'destructive'
      });
      throw error;
    }
  }, [user, agencyId, fetchAgencyPages, toast]);

  return {
    pages,
    loading,
    totalCost,
    fetchAgencyPages,
    assignPages
  };
}

export function useAgencyPageRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AgencyPageRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/system/page-catalog/agencies/me/page-requests`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch page requests');
      }

      const data = await response.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching page requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch page requests',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const requestPage = useCallback(async (pageId: string, reason?: string) => {
    if (!user) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/system/page-catalog/agencies/me/page-requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          page_id: pageId,
          reason: reason || ''
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to request page');
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: data.message || 'Page request submitted successfully'
        });
        await fetchRequests();
        return data.data;
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request page',
        variant: 'destructive'
      });
      throw error;
    }
  }, [user, fetchRequests, toast]);

  return {
    requests,
    loading,
    fetchRequests,
    requestPage
  };
}

