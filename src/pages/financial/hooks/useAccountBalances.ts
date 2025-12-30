/**
 * Hook for calculating and managing account balances
 */

import { useState, useEffect } from 'react';
import { rawQuery } from '@/services/api/postgresql-service';
import { logDebug, logWarn, logError } from '@/utils/consoleLogger';
import { calculateAccountBalances } from '../utils/financialCalculations';

export const useAccountBalances = (chartOfAccounts: any[], agencyId: string | null) => {
  const [accountBalances, setAccountBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const calculateBalances = async () => {
      const effectiveAgencyId = agencyId;
      if (!effectiveAgencyId || chartOfAccounts.length === 0) {
        if (chartOfAccounts.length === 0) {
          setAccountBalances({});
        }
        return;
      }

      if (loading) {
        return;
      }

      setLoading(true);
      try {
        let query = `
          SELECT 
            coa.id as account_id,
            coa.account_type,
            COALESCE(SUM(jel.debit_amount), 0) as total_debits,
            COALESCE(SUM(jel.credit_amount), 0) as total_credits
          FROM chart_of_accounts coa
          LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
          LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id 
            AND je.status = 'posted' 
            AND je.agency_id = $1
          WHERE (coa.agency_id = $1 OR coa.agency_id IS NULL)
          GROUP BY coa.id, coa.account_type
        `;
        
        let balancesData: any[] = [];
        try {
          balancesData = await rawQuery(query, [effectiveAgencyId]);
          logDebug(`Calculated account balances for ${balancesData.length} accounts`);
        } catch (err: any) {
          const message = String(err?.message || '');
          if (err?.code === '42703' || message.includes('agency_id') || message.includes('does not exist')) {
            logWarn('agency_id column missing, using fallback query for balance calculation');
            query = `
              SELECT 
                coa.id as account_id,
                coa.account_type,
                COALESCE(SUM(jel.debit_amount), 0) as total_debits,
                COALESCE(SUM(jel.credit_amount), 0) as total_credits
              FROM chart_of_accounts coa
              LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
              LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id 
                AND je.status = 'posted'
                AND je.agency_id = $1
              GROUP BY coa.id, coa.account_type
            `;
            try {
              balancesData = await rawQuery(query, [effectiveAgencyId]);
              logDebug(`Calculated account balances (fallback 1) for ${balancesData.length} accounts`);
            } catch (err2: any) {
              logWarn('Using final fallback - no agency filtering for balances');
              query = `
                SELECT 
                  coa.id as account_id,
                  coa.account_type,
                  COALESCE(SUM(jel.debit_amount), 0) as total_debits,
                  COALESCE(SUM(jel.credit_amount), 0) as total_credits
                FROM chart_of_accounts coa
                LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
                LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id 
                  AND je.status = 'posted'
                GROUP BY coa.id, coa.account_type
              `;
              balancesData = await rawQuery(query, []);
              logDebug(`Calculated account balances (fallback 2) for ${balancesData.length} accounts`);
            }
          } else {
            throw err;
          }
        }
        
        const balances = calculateAccountBalances(balancesData);
        
        let totalAssets = 0;
        let totalLiabilities = 0;
        let totalEquity = 0;
        
        balancesData.forEach((row: any) => {
          const { account_type } = row;
          const balance = balances[row.account_id] || 0;
          if (account_type === 'asset') totalAssets += balance;
          else if (account_type === 'liability') totalLiabilities += balance;
          else if (account_type === 'equity') totalEquity += balance;
        });
        
        logDebug(`Account balances calculated - Assets: ₹${totalAssets.toLocaleString()}, Liabilities: ₹${totalLiabilities.toLocaleString()}, Equity: ₹${totalEquity.toLocaleString()}`);
        setAccountBalances(balances);
      } catch (error) {
        logError('Error calculating account balances:', error);
        setAccountBalances({});
      } finally {
        setLoading(false);
      }
    };

    if (chartOfAccounts.length > 0 && agencyId && !loading) {
      calculateBalances();
    } else if (chartOfAccounts.length === 0) {
      setAccountBalances({});
    }
  }, [chartOfAccounts.length, agencyId, loading]);

  return {
    accountBalances,
    loading,
    setAccountBalances,
  };
};

