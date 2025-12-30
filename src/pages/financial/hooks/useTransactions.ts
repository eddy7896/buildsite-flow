/**
 * Hook for transactions data fetching
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { rawQuery } from '@/services/api/postgresql-service';
import { logDebug, logWarn, logError } from '@/utils/consoleLogger';

export const useTransactions = (agencyId: string | null) => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async (agencyIdParam?: string | null) => {
    const effectiveAgencyId = agencyIdParam || agencyId;
    setLoading(true);
    try {
      let query: string;
      let params: any[] = [];
      
      if (effectiveAgencyId) {
        query = `
          SELECT 
            jel.id,
            je.entry_date as date,
            COALESCE(jel.description, je.description) as description,
            COALESCE(coa.account_type, 'Other') as category,
            CASE WHEN jel.debit_amount > 0 THEN 'debit' ELSE 'credit' END as type,
            COALESCE(jel.debit_amount, jel.credit_amount, 0) as amount,
            je.reference,
            je.entry_number,
            coa.account_name,
            coa.account_code
          FROM journal_entry_lines jel
          JOIN journal_entries je ON jel.journal_entry_id = je.id
          LEFT JOIN chart_of_accounts coa ON jel.account_id = coa.id
          WHERE je.status = 'posted' AND je.agency_id = $1
          ORDER BY je.entry_date DESC, COALESCE(jel.line_number, 1), jel.id ASC
        `;
        params = [effectiveAgencyId];
      } else {
        query = `
          SELECT 
            jel.id,
            je.entry_date as date,
            COALESCE(jel.description, je.description) as description,
            COALESCE(coa.account_type, 'Other') as category,
            CASE WHEN jel.debit_amount > 0 THEN 'debit' ELSE 'credit' END as type,
            COALESCE(jel.debit_amount, jel.credit_amount, 0) as amount,
            je.reference,
            je.entry_number,
            coa.account_name,
            coa.account_code
          FROM journal_entry_lines jel
          JOIN journal_entries je ON jel.journal_entry_id = je.id
          LEFT JOIN chart_of_accounts coa ON jel.account_id = coa.id
          WHERE je.status = 'posted'
          ORDER BY je.entry_date DESC, COALESCE(jel.line_number, 1), jel.id ASC
        `;
      }
      
      let txnData: any[] = [];
      try {
        txnData = await rawQuery(query, params);
      } catch (err: any) {
        const message = String(err?.message || '');
        if (err?.code === '42703' || message.includes('column')) {
          if (message.includes('agency_id')) {
            logWarn('journal_entries has no agency_id column, falling back to all transactions');
            query = `
              SELECT 
                jel.id,
                je.entry_date as date,
                COALESCE(jel.description, je.description) as description,
                COALESCE(coa.account_type, 'Other') as category,
                CASE WHEN jel.debit_amount > 0 THEN 'debit' ELSE 'credit' END as type,
                COALESCE(jel.debit_amount, jel.credit_amount, 0) as amount,
                je.reference,
                je.entry_number,
                coa.account_name,
                coa.account_code
              FROM journal_entry_lines jel
              JOIN journal_entries je ON jel.journal_entry_id = je.id
              LEFT JOIN chart_of_accounts coa ON jel.account_id = coa.id
              WHERE je.status = 'posted'
              ORDER BY je.entry_date DESC, COALESCE(jel.line_number, 1), jel.id ASC
            `;
            txnData = await rawQuery(query, []);
          } else if (message.includes('line_number')) {
            logWarn('journal_entry_lines has no line_number column, falling back to ordering by id');
            if (effectiveAgencyId) {
              query = `
                SELECT 
                  jel.id,
                  je.entry_date as date,
                  COALESCE(jel.description, je.description) as description,
                  COALESCE(coa.account_type, 'Other') as category,
                  CASE WHEN jel.debit_amount > 0 THEN 'debit' ELSE 'credit' END as type,
                  COALESCE(jel.debit_amount, jel.credit_amount, 0) as amount,
                  je.reference,
                  je.entry_number,
                  coa.account_name,
                  coa.account_code
                FROM journal_entry_lines jel
                JOIN journal_entries je ON jel.journal_entry_id = je.id
                LEFT JOIN chart_of_accounts coa ON jel.account_id = coa.id
                WHERE je.status = 'posted' AND je.agency_id = $1
                ORDER BY je.entry_date DESC, jel.id ASC
              `;
              txnData = await rawQuery(query, [effectiveAgencyId]);
            } else {
              query = `
                SELECT 
                  jel.id,
                  je.entry_date as date,
                  COALESCE(jel.description, je.description) as description,
                  COALESCE(coa.account_type, 'Other') as category,
                  CASE WHEN jel.debit_amount > 0 THEN 'debit' ELSE 'credit' END as type,
                  COALESCE(jel.debit_amount, jel.credit_amount, 0) as amount,
                  je.reference,
                  je.entry_number,
                  coa.account_name,
                  coa.account_code
                FROM journal_entry_lines jel
                JOIN journal_entries je ON jel.journal_entry_id = je.id
                LEFT JOIN chart_of_accounts coa ON jel.account_id = coa.id
                WHERE je.status = 'posted'
                ORDER BY je.entry_date DESC, jel.id ASC
              `;
              txnData = await rawQuery(query, []);
            }
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
      setTransactions(txnData || []);
      logDebug(`Fetched transactions: ${txnData?.length || 0} transactions`);
      
      if ((txnData || []).length === 0) {
        logWarn('No transactions found. This may be normal if no journal entries have been posted yet.');
      }
    } catch (error: any) {
      logError('Error fetching transactions:', error);
      toast({
        title: 'Warning',
        description: `Could not fetch transactions: ${error?.message || 'Unknown error'}. Financial stats may be incomplete.`,
        variant: 'default',
      });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    transactions,
    loading,
    fetchTransactions,
  };
};

