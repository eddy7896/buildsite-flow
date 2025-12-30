/**
 * Hook for fetching all financial data
 * Centralized data fetching for financial management
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logWarn, logError } from '@/utils/consoleLogger';
import { getAgencyId } from '@/utils/agencyUtils';
import { useJobs } from './useJobs';
import { useChartOfAccounts } from './useChartOfAccounts';
import { useJournalEntries } from './useJournalEntries';
import { useTransactions } from './useTransactions';
import { useProjects } from './useProjects';

export const useFinancialData = (user: any, profile: any) => {
  const { toast } = useToast();
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    jobs,
    loading: jobsLoading,
    fetchJobs,
  } = useJobs(agencyId);

  const {
    projects,
    loading: projectsLoading,
    fetchProjects,
  } = useProjects(agencyId, profile, user);

  const {
    chartOfAccounts,
    loading: accountsLoading,
    fetchChartOfAccounts,
  } = useChartOfAccounts(agencyId);

  const {
    journalEntries,
    loading: entriesLoading,
    fetchJournalEntries,
  } = useJournalEntries(agencyId);

  const {
    transactions,
    loading: transactionsLoading,
    fetchTransactions,
  } = useTransactions(agencyId);

  useEffect(() => {
    const initializeAgency = async () => {
      const agencyDatabase = localStorage.getItem('agency_database');
      
      let id: string | null = null;
      
      const storedAgencyId = localStorage.getItem('agency_id');
      if (storedAgencyId) {
        id = storedAgencyId;
      } else {
        id = await getAgencyId(profile, user?.id);
      }
      
      if (agencyDatabase || id) {
        setAgencyId(id || '00000000-0000-0000-0000-000000000000');
      }
    };

    if (user?.id) {
      initializeAgency();
    }
  }, [user?.id, profile?.agency_id]);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!agencyId) {
        logWarn('No agency_id available, cannot fetch data');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await Promise.all([
          fetchJobs(agencyId),
          fetchProjects(agencyId),
          fetchChartOfAccounts(agencyId),
          fetchJournalEntries(agencyId),
          fetchTransactions(agencyId),
        ]);
      } catch (error) {
        logError('Error fetching financial data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load financial data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (agencyId) {
      fetchAllData();
    }
  }, [agencyId]);

  const refetchAll = async () => {
    if (!agencyId) return;
    
    setLoading(true);
    try {
      await Promise.all([
        fetchJobs(agencyId),
        fetchProjects(agencyId),
        fetchChartOfAccounts(agencyId),
        fetchJournalEntries(agencyId),
        fetchTransactions(agencyId),
      ]);
    } catch (error) {
      logError('Error refetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    agencyId,
    jobs,
    projects,
    chartOfAccounts,
    journalEntries,
    transactions,
    loading: loading || jobsLoading || projectsLoading || accountsLoading || entriesLoading || transactionsLoading,
    refetchAll,
    fetchJobs,
    fetchProjects,
    fetchChartOfAccounts,
    fetchJournalEntries,
    fetchTransactions,
    setJobs,
    setChartOfAccounts,
    setJournalEntries,
  };
};

