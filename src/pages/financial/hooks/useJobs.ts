/**
 * Hook for jobs data fetching and operations
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { selectRecords } from '@/services/api/postgresql-service';
import { logWarn, logError } from '@/utils/consoleLogger';

export const useJobs = (agencyId: string | null) => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchJobs = async (agencyIdParam?: string | null) => {
    const effectiveAgencyId = agencyIdParam || agencyId;
    setLoading(true);
    try {
      let jobsData: any[] = [];
      if (effectiveAgencyId) {
        try {
          jobsData = await selectRecords('jobs', {
            where: { agency_id: effectiveAgencyId },
            orderBy: 'created_at DESC',
          });
        } catch (err: any) {
          if (err?.code === '42703' || String(err?.message || '').includes('agency_id')) {
            logWarn('jobs has no agency_id column, falling back to all jobs');
            jobsData = await selectRecords('jobs', {
              orderBy: 'created_at DESC',
            });
          } else {
            throw err;
          }
        }
      } else {
        jobsData = await selectRecords('jobs', {
          orderBy: 'created_at DESC',
        });
      }
      setJobs(jobsData || []);
    } catch (error: any) {
      logError('Error fetching jobs:', error);
      if (error?.code !== '42703') {
        toast({
          title: 'Error',
          description: 'Failed to fetch jobs',
          variant: 'destructive',
        });
      }
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    jobs,
    loading,
    fetchJobs,
    setJobs,
  };
};

