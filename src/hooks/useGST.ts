import { useState, useEffect } from 'react';
import { GSTService, type GSTSettings, type GSTReturn, type GSTTransaction, type GSTLiability } from '@/services/api/gst-service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Re-export types for backward compatibility
export type { GSTSettings, GSTReturn, GSTTransaction, GSTLiability };

export const useGST = () => {
  const [settings, setSettings] = useState<GSTSettings | null>(null);
  const [returns, setReturns] = useState<GSTReturn[]>([]);
  const [transactions, setTransactions] = useState<GSTTransaction[]>([]);
  const [liability, setLiability] = useState<GSTLiability | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();

  const fetchSettings = async () => {
    if (!user || !profile?.agency_id) {
      console.log('Cannot fetch GST settings: user not authenticated or no agency_id', { user: !!user, agencyId: profile?.agency_id });
      return;
    }

    try {
      setLoading(true);
      const response = await GSTService.getSettings();
      
      if (response.success && response.data) {
        setSettings(response.data);
      } else {
        setSettings(null);
      }
    } catch (error) {
      console.error('Error fetching GST settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch GST settings",
        variant: "destructive"
      });
      setSettings(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchReturns = async () => {
    if (!user || !profile?.agency_id) {
      console.log('Cannot fetch GST returns: user not authenticated or no agency_id', { user: !!user, agencyId: profile?.agency_id });
      return;
    }

    try {
      setLoading(true);
      const response = await GSTService.getReturns();
      
      if (response.success && response.data) {
        setReturns(response.data || []);
      } else {
        setReturns([]);
      }
    } catch (error) {
      console.error('Error fetching GST returns:', error);
      toast({
        title: "Error",
        description: "Failed to fetch GST returns",
        variant: "destructive"
      });
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (filters?: { 
    transaction_type?: string; 
    start_date?: string; 
    end_date?: string;
    invoice_number?: string;
  }) => {
    if (!user || !profile?.agency_id) {
      console.log('Cannot fetch GST transactions: user not authenticated or no agency_id');
      return;
    }

    try {
      setLoading(true);
      const response = await GSTService.getTransactions(filters);
      
      if (response.success && response.data) {
        setTransactions(response.data || []);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching GST transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch GST transactions",
        variant: "destructive"
      });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiability = async (startDate: string, endDate: string) => {
    if (!user || !profile?.agency_id) {
      console.log('Cannot fetch GST liability: user not authenticated or no agency_id');
      return;
    }

    try {
      setLoading(true);
      const response = await GSTService.calculateLiability(startDate, endDate);
      
      if (response.success && response.data) {
        setLiability(response.data);
      } else {
        setLiability({
          total_taxable_value: 0,
          total_cgst: 0,
          total_sgst: 0,
          total_igst: 0,
          total_cess: 0,
          total_tax: 0
        });
      }
    } catch (error) {
      console.error('Error calculating GST liability:', error);
      toast({
        title: "Error",
        description: "Failed to calculate GST liability",
        variant: "destructive"
      });
      setLiability({
        total_taxable_value: 0,
        total_cgst: 0,
        total_sgst: 0,
        total_igst: 0,
        total_cess: 0,
        total_tax: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (settingsData: Omit<GSTSettings, 'id' | 'agency_id' | 'created_at' | 'updated_at'>) => {
    if (!user || !profile?.agency_id) {
      toast({
        title: "Error",
        description: "User not authenticated or no agency found",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      let response;
      if (settings?.id) {
        response = await GSTService.updateSettings(settings.id, settingsData);
      } else {
        response = await GSTService.createSettings(settingsData);
      }
      
      if (response.success) {
        await fetchSettings();
        toast({
          title: "Success",
          description: "GST settings saved successfully"
        });
      } else {
        throw new Error(response.error || 'Failed to save GST settings');
      }
    } catch (error) {
      console.error('Error saving GST settings:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save GST settings",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (transaction: Omit<GSTTransaction, 'id' | 'agency_id' | 'created_at' | 'updated_at'>) => {
    if (!user || !profile?.agency_id) {
      toast({
        title: "Error",
        description: "User not authenticated or no agency found",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const response = await GSTService.createTransaction(transaction);
      
      if (response.success) {
        await fetchTransactions();
        toast({
          title: "Success",
          description: "GST transaction created successfully"
        });
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create GST transaction');
      }
    } catch (error) {
      console.error('Error creating GST transaction:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create GST transaction",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async (transactionId: string, transaction: Partial<Omit<GSTTransaction, 'id' | 'agency_id' | 'created_at'>>) => {
    if (!user || !profile?.agency_id) {
      toast({
        title: "Error",
        description: "User not authenticated or no agency found",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const response = await GSTService.updateTransaction(transactionId, transaction);
      
      if (response.success) {
        await fetchTransactions();
        toast({
          title: "Success",
          description: "GST transaction updated successfully"
        });
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update GST transaction');
      }
    } catch (error) {
      console.error('Error updating GST transaction:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update GST transaction",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    if (!user || !profile?.agency_id) {
      toast({
        title: "Error",
        description: "User not authenticated or no agency found",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const response = await GSTService.deleteTransaction(transactionId);
      
      if (response.success) {
        await fetchTransactions();
        toast({
          title: "Success",
          description: "GST transaction deleted successfully"
        });
      } else {
        throw new Error(response.error || 'Failed to delete GST transaction');
      }
    } catch (error) {
      console.error('Error deleting GST transaction:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete GST transaction",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const generateReturn = async (returnType: 'GSTR1' | 'GSTR3B' | 'GSTR9' | 'GSTR4', filingPeriod: string) => {
    if (!user || !profile?.agency_id) {
      toast({
        title: "Error",
        description: "User not authenticated or no agency found",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const response = await GSTService.generateReturn(returnType, filingPeriod);
      
      if (response.success && response.data) {
        await fetchReturns();
        toast({
          title: "Success",
          description: "GST return generated successfully"
        });
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to generate GST return');
      }
    } catch (error) {
      console.error('Error generating GST return:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate GST return",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateReturn = async (returnId: string, gstReturn: Partial<Omit<GSTReturn, 'id' | 'agency_id' | 'created_at'>>) => {
    if (!user || !profile?.agency_id) {
      toast({
        title: "Error",
        description: "User not authenticated or no agency found",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const response = await GSTService.updateReturn(returnId, gstReturn);
      
      if (response.success) {
        await fetchReturns();
        toast({
          title: "Success",
          description: "GST return updated successfully"
        });
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update GST return');
      }
    } catch (error) {
      console.error('Error updating GST return:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update GST return",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data when user is authenticated and profile is loaded
    console.log('GST useEffect triggered:', { authLoading, user: !!user, agencyId: profile?.agency_id });
    if (!authLoading && user && profile?.agency_id) {
      console.log('Fetching GST data for agency:', profile.agency_id);
      fetchSettings();
      fetchReturns();
      fetchTransactions();
    }
  }, [user, profile, authLoading]);

  return {
    settings,
    returns,
    transactions,
    liability,
    loading: loading || authLoading,
    fetchSettings,
    fetchReturns,
    fetchTransactions,
    fetchLiability,
    saveSettings,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    generateReturn,
    updateReturn,
    isAuthenticated: !!user && !!profile?.agency_id
  };
};
