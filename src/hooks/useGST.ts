import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gst_settings')
        .select('*')
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
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gst_returns')
        .select('*')
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
    try {
      setLoading(true);
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!userProfile?.agency_id) throw new Error('Agency ID not found');

      const { data, error } = await supabase.rpc('calculate_gst_liability', {
        p_agency_id: userProfile.agency_id,
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
    try {
      setLoading(true);
      
      if (settings?.id) {
        const { error } = await supabase
          .from('gst_settings')
          .update(settingsData)
          .eq('id', settings.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('gst_settings')
          .insert([settingsData]);
        
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
    fetchSettings();
    fetchReturns();
  }, []);

  return {
    settings,
    returns,
    liability,
    loading,
    fetchSettings,
    fetchReturns,
    fetchLiability,
    saveSettings
  };
};