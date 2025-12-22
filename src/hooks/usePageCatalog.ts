/**
 * Page Catalog Hook
 * Manages page catalog operations (super admin only)
 */

import { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '@/config/api';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { PageCatalog, PageRecommendationRule } from '@/types/pageCatalog';

interface UsePageCatalogOptions {
  category?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export function usePageCatalog(options: UsePageCatalogOptions = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pages, setPages] = useState<PageCatalog[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  const fetchPages = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (options.category) params.append('category', options.category);
      if (options.is_active !== undefined) params.append('is_active', String(options.is_active));
      if (options.search) params.append('search', options.search);
      if (options.page) params.append('page', String(options.page));
      if (options.limit) params.append('limit', String(options.limit));

      const response = await fetch(
        `${getApiBaseUrl()}/api/system/page-catalog?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }

      const data = await response.json();
      if (data.success) {
        setPages(data.data);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch page catalog',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, options, toast]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const createPage = useCallback(async (pageData: Partial<PageCatalog>) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/system/page-catalog`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pageData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create page');
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Page created successfully'
        });
        await fetchPages();
        return data.data;
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create page',
        variant: 'destructive'
      });
      throw error;
    }
  }, [fetchPages, toast]);

  const updatePage = useCallback(async (id: string, updates: Partial<PageCatalog>) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/system/page-catalog/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update page');
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Page updated successfully'
        });
        await fetchPages();
        return data.data;
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update page',
        variant: 'destructive'
      });
      throw error;
    }
  }, [fetchPages, toast]);

  const deletePage = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/system/page-catalog/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete page');
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Page deactivated successfully'
        });
        await fetchPages();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete page',
        variant: 'destructive'
      });
      throw error;
    }
  }, [fetchPages, toast]);

  const createRecommendationRule = useCallback(async (
    pageId: string,
    rule: Partial<PageRecommendationRule>
  ) => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/system/page-catalog/${pageId}/recommendation-rules`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(rule)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create recommendation rule');
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Recommendation rule created successfully'
        });
        return data.data;
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create recommendation rule',
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast]);

  return {
    pages,
    loading,
    pagination,
    fetchPages,
    createPage,
    updatePage,
    deletePage,
    createRecommendationRule
  };
}

