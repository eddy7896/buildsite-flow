/**
 * Hook for Agency Settings
 * Note: This extends the existing useAgencySettings hook with additional functionality
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAgencySettings as useAgencySettingsHook } from '@/hooks/useAgencySettings';
import { parseWorkingDays } from '../utils/settingsHelpers';

export interface AgencySettings {
  id?: string;
  agency_id?: string;
  agency_name: string;
  logo_url: string;
  domain: string;
  default_currency: string;
  primary_color: string;
  secondary_color: string;
  timezone: string;
  date_format: string;
  fiscal_year_start: string;
  working_hours_start: string;
  working_hours_end: string;
  working_days: string[];
}

export const useAgencySettingsExtended = () => {
  const { toast } = useToast();
  const { settings: agencySettingsData, saveSettings: saveAgencySettingsData, loading: loadingAgencyData } = useAgencySettingsHook();
  
  const [agencySettings, setAgencySettings] = useState<AgencySettings>({
    agency_name: '',
    logo_url: '',
    domain: '',
    default_currency: 'IN',
    primary_color: '#3b82f6',
    secondary_color: '#1e40af',
    timezone: 'Asia/Kolkata',
    date_format: 'DD/MM/YYYY',
    fiscal_year_start: '04-01',
    working_hours_start: '09:00',
    working_hours_end: '18:00',
    working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  });
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Update agency settings when hook data changes
  useEffect(() => {
    if (agencySettingsData) {
      const workingDays = parseWorkingDays(agencySettingsData.working_days);

      setAgencySettings({
        id: agencySettingsData.id,
        agency_id: agencySettingsData.agency_id,
        agency_name: agencySettingsData.agency_name || '',
        logo_url: agencySettingsData.logo_url || '',
        domain: agencySettingsData.domain || '',
        default_currency: agencySettingsData.default_currency || 'IN',
        primary_color: agencySettingsData.primary_color || '#3b82f6',
        secondary_color: agencySettingsData.secondary_color || '#1e40af',
        timezone: agencySettingsData.timezone || 'Asia/Kolkata',
        date_format: agencySettingsData.date_format || 'DD/MM/YYYY',
        fiscal_year_start: agencySettingsData.fiscal_year_start || '04-01',
        working_hours_start: agencySettingsData.working_hours_start || '09:00',
        working_hours_end: agencySettingsData.working_hours_end || '18:00',
        working_days: workingDays,
      });
      setLogoPreview(agencySettingsData.logo_url || '');
    }
  }, [agencySettingsData]);

  const saveAgencySettings = async () => {
    setLoading(true);
    try {
      const settingsToSave: any = {
        agency_name: agencySettings.agency_name,
        domain: agencySettings.domain,
        default_currency: agencySettings.default_currency,
        currency: agencySettings.default_currency,
        primary_color: agencySettings.primary_color,
        secondary_color: agencySettings.secondary_color,
        timezone: agencySettings.timezone,
        date_format: agencySettings.date_format,
        fiscal_year_start: agencySettings.fiscal_year_start,
        working_hours_start: agencySettings.working_hours_start,
        working_hours_end: agencySettings.working_hours_end,
        working_days: agencySettings.working_days,
      };

      if (logoFile && logoPreview) {
        const logoSize = logoPreview.length;
        const logoSizeMB = (logoSize / (1024 * 1024)).toFixed(2);
        
        if (logoSize > 5 * 1024 * 1024) {
          toast({
            title: "Warning",
            description: `Logo is ${logoSizeMB}MB. Consider using a smaller image.`,
            variant: "destructive",
          });
        }
        
        settingsToSave.logo_url = logoPreview;
      } else if (!agencySettings.logo_url && agencySettingsData?.logo_url) {
        settingsToSave.logo_url = '';
      }

      const result = await saveAgencySettingsData(settingsToSave);

      if (result.success) {
        if (logoFile && logoPreview) {
          setAgencySettings(prev => ({ ...prev, logo_url: logoPreview }));
        }
        setLogoFile(null);

        toast({
          title: "Success",
          description: "Agency settings updated successfully",
        });
      } else {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error('Error saving agency settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update agency settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    agencySettings,
    setAgencySettings,
    loading: loading || loadingAgencyData,
    logoFile,
    setLogoFile,
    logoPreview,
    setLogoPreview,
    saveAgencySettings,
  };
};

