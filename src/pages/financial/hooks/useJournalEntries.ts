/**
 * Hook for journal entries data fetching
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { selectRecords } from '@/services/api/postgresql-service';
import { logDebug, logWarn, logError } from '@/utils/consoleLogger';

export const useJournalEntries = (agencyId: string | null) => {
  const { toast } = useToast();
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchJournalEntries = async (agencyIdParam?: string | null) => {
    const effectiveAgencyId = agencyIdParam || agencyId;
    setLoading(true);
    try {
      let entries: any[] = [];
      
      if (effectiveAgencyId && effectiveAgencyId !== '00000000-0000-0000-0000-000000000000') {
        try {
          entries = await selectRecords('journal_entries', {
            where: { agency_id: effectiveAgencyId },
            orderBy: 'entry_date DESC, created_at DESC',
          });
          logDebug(`Fetched journal entries with agency_id filter: ${entries?.length || 0} entries`);
        } catch (err: any) {
          if (err?.code === '42703' || String(err?.message || '').includes('agency_id') || String(err?.message || '').includes('does not exist')) {
            logWarn('journal_entries has no agency_id column, trying fallback strategies');
            try {
              const allEntries = await selectRecords('journal_entries', {
                orderBy: 'entry_date DESC, created_at DESC',
              });
              entries = (allEntries || []).filter((e: any) => 
                !e.agency_id || e.agency_id === effectiveAgencyId
              );
              logDebug(`Fetched journal entries (fallback): ${entries?.length || 0} entries from ${allEntries?.length || 0} total`);
            } catch (fallbackErr: any) {
              logError('Fallback fetch also failed:', fallbackErr);
              entries = [];
            }
          } else {
            throw err;
          }
        }
      } else {
        try {
          entries = await selectRecords('journal_entries', {
            orderBy: 'entry_date DESC, created_at DESC',
          });
          logDebug(`Fetched journal entries (no agency filter): ${entries?.length || 0} entries`);
        } catch (err: any) {
          logError('Error fetching journal entries without agency filter:', err);
          entries = [];
        }
      }
      
      setJournalEntries(entries || []);
      
      if ((entries || []).length === 0) {
        logWarn('No journal entries found. This may be normal if no entries have been created yet.');
      }
    } catch (error: any) {
      logError('Error fetching journal entries:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch journal entries: ${error?.message || 'Unknown error'}`,
        variant: 'destructive',
      });
      setJournalEntries([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    journalEntries,
    loading,
    fetchJournalEntries,
    setJournalEntries,
  };
};

