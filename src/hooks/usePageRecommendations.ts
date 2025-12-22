/**
 * Page Recommendations Hook
 * Fetches page recommendations based on agency criteria
 */

import { useState, useCallback } from 'react';
import { getApiBaseUrl } from '@/config/api';
import { useToast } from './use-toast';
import type { PageRecommendations } from '@/types/pageCatalog';

interface RecommendationCriteria {
  industry: string;
  company_size: string;
  primary_focus: string;
  business_goals?: string[];
}

export function usePageRecommendations() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<PageRecommendations | null>(null);

  const getRecommendations = useCallback(async (criteria: RecommendationCriteria) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('industry', criteria.industry);
      params.append('company_size', criteria.company_size);
      params.append('primary_focus', criteria.primary_focus);
      if (criteria.business_goals && criteria.business_goals.length > 0) {
        criteria.business_goals.forEach(goal => params.append('business_goals', goal));
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/system/page-catalog/recommendations/preview?${params.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      if (data.success) {
        setRecommendations(data.data);
        return data.data;
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch page recommendations',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    recommendations,
    loading,
    getRecommendations
  };
}

