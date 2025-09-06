import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface GSTSettings {
  id?: string;
  gstin: string;
  legal_name: string;
  trade_name?: string;
  business_type: 'regular' | 'composition' | 'casual' | 'non_resident';
  filing_frequency: 'monthly' | 'quarterly' | 'annual';
  composition_scheme: boolean;
  is_active?: boolean;
}

export interface GSTReturn {
  id?: string;
  return_type: 'GSTR1' | 'GSTR3B' | 'GSTR9' | 'GSTR4';
  filing_period: string;
  due_date: string;
  status: 'pending' | 'filed' | 'late' | 'cancelled';
  total_taxable_value: number;
  total_tax_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  filed_date?: string;
  acknowledgment_number?: string;
}

export interface GSTLiability {
  total_taxable_value: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;
  total_cess: number;
  total_tax: number;
}

export const useGST = () => {
  const [settings, setSettings] = useState<GSTSettings | null>(null);
  const [returns, setReturns] = useState<GSTReturn[]>([]);
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
      const { data, error } = await supabase
        .from('gst_settings')
        .select('*')
        .eq('agency_id', profile.agency_id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      setSettings(data as GSTSettings);
    } catch (error) {
      console.error('Error fetching GST settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch GST settings",
        variant: "destructive"
      });
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
      const { data, error } = await supabase
        .from('gst_returns')
        .select('*')
        .eq('agency_id', profile.agency_id)
        .order('filing_period', { ascending: false });

      if (error) throw error;
      setReturns((data || []) as GSTReturn[]);
    } catch (error) {
      console.error('Error fetching GST returns:', error);
      toast({
        title: "Error",
        description: "Failed to fetch GST returns",
        variant: "destructive"
      });
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
      const { data, error } = await supabase.rpc('calculate_gst_liability', {
        p_agency_id: profile.agency_id,
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) throw error;
      setLiability(data?.[0] || null);
    } catch (error) {
      console.error('Error calculating GST liability:', error);
      toast({
        title: "Error",
        description: "Failed to calculate GST liability",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (settingsData: Omit<GSTSettings, 'id'>) => {
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
      
      const dataWithAgency = { ...settingsData, agency_id: profile.agency_id };
      
      if (settings?.id) {
        const { error } = await supabase
          .from('gst_settings')
          .update(dataWithAgency)
          .eq('id', settings.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('gst_settings')
          .insert([dataWithAgency]);
        
        if (error) throw error;
      }

      await fetchSettings();
      toast({
        title: "Success",
        description: "GST settings saved successfully"
      });
    } catch (error) {
      console.error('Error saving GST settings:', error);
      toast({
        title: "Error",
        description: "Failed to save GST settings",
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
    }
  }, [user, profile, authLoading]);

  return {
    settings,
    returns,
    liability,
    loading: loading || authLoading,
    fetchSettings,
    fetchReturns,
    fetchLiability,
    saveSettings,
    isAuthenticated: !!user && !!profile?.agency_id
  };
};