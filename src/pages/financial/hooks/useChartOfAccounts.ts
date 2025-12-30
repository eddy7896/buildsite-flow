/**
 * Hook for chart of accounts data fetching
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { selectRecords } from '@/services/api/postgresql-service';
import { logWarn, logError } from '@/utils/consoleLogger';

export const useChartOfAccounts = (agencyId: string | null) => {
  const { toast } = useToast();
  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChartOfAccounts = async (agencyIdParam?: string | null) => {
    const effectiveAgencyId = agencyIdParam || agencyId;
    setLoading(true);
    try {
      if (!effectiveAgencyId) {
        const accounts = await selectRecords('chart_of_accounts', {
          where: { is_active: true },
          orderBy: 'account_code ASC',
        });
        setChartOfAccounts(accounts || []);
        return;
      }
      let accounts: any[] = [];
      try {
        accounts = await selectRecords('chart_of_accounts', {
          where: { agency_id: effectiveAgencyId },
          orderBy: 'account_code ASC',
        });
      } catch (err: any) {
        if (err?.code === '42703' || String(err?.message || '').includes('agency_id')) {
          logWarn('chart_of_accounts has no agency_id column, falling back to global accounts');
          accounts = await selectRecords('chart_of_accounts', {
            where: { is_active: true },
            orderBy: 'account_code ASC',
          });
        } else {
          throw err;
        }
      }
      setChartOfAccounts(accounts || []);
    } catch (error) {
      logError('Error fetching chart of accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch chart of accounts',
        variant: 'destructive',
      });
      setChartOfAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    chartOfAccounts,
    loading,
    fetchChartOfAccounts,
    setChartOfAccounts,
  };
};

