import { useState, useEffect } from 'react';
import { selectOne, updateRecord, insertRecord } from '@/services/api/postgresql-service';
import { useAuth } from '@/hooks/useAuth';

export interface AgencySettings {
  id?: string;
  agency_id?: string;
  agency_name: string;
  logo_url: string | null;
  domain: string | null;
  default_currency: string;
  currency?: string; // Legacy field for backward compatibility
  primary_color: string;
  secondary_color: string;
  timezone: string;
  date_format: string;
  fiscal_year_start: string;
  working_hours_start: string;
  working_hours_end: string;
  working_days: string[] | string; // Can be array or JSON string
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_SETTINGS: Omit<AgencySettings, 'id' | 'agency_id' | 'created_at' | 'updated_at'> = {
  agency_name: '',
  logo_url: null,
  domain: null,
  default_currency: 'IN',
  primary_color: '#3b82f6',
  secondary_color: '#1e40af',
  timezone: 'Asia/Kolkata',
  date_format: 'DD/MM/YYYY',
  fiscal_year_start: '04-01',
  working_hours_start: '09:00',
  working_hours_end: '18:00',
  working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
};

export const useAgencySettings = () => {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<AgencySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch agency settings
      const agencySettings = await selectOne<AgencySettings>('agency_settings', {});

      if (agencySettings) {
        // Parse working_days if it's a string or handle JSONB
        let workingDays = agencySettings.working_days;
        if (typeof workingDays === 'string') {
          try {
            // Try to parse as JSON
            const parsed = JSON.parse(workingDays);
            workingDays = Array.isArray(parsed) ? parsed : DEFAULT_SETTINGS.working_days;
          } catch {
            // If parsing fails, check if it's a comma-separated string
            if (workingDays.includes(',')) {
              workingDays = workingDays.split(',').map(d => d.trim());
            } else {
              // Use default if parsing fails
              workingDays = DEFAULT_SETTINGS.working_days;
            }
          }
        } else if (!Array.isArray(workingDays)) {
          // If it's not an array, use default
          workingDays = DEFAULT_SETTINGS.working_days;
        }

        const parsedSettings: AgencySettings = {
          ...agencySettings,
          working_days: workingDays as string[],
          default_currency: agencySettings.default_currency || agencySettings.currency || DEFAULT_SETTINGS.default_currency,
          primary_color: agencySettings.primary_color || DEFAULT_SETTINGS.primary_color,
          secondary_color: agencySettings.secondary_color || DEFAULT_SETTINGS.secondary_color,
          timezone: agencySettings.timezone || DEFAULT_SETTINGS.timezone,
          date_format: agencySettings.date_format || DEFAULT_SETTINGS.date_format,
          fiscal_year_start: agencySettings.fiscal_year_start || DEFAULT_SETTINGS.fiscal_year_start,
          working_hours_start: agencySettings.working_hours_start || DEFAULT_SETTINGS.working_hours_start,
          working_hours_end: agencySettings.working_hours_end || DEFAULT_SETTINGS.working_hours_end,
        };

        setSettings(parsedSettings);
        
        // Apply theme colors to CSS variables
        if (parsedSettings.primary_color) {
          document.documentElement.style.setProperty('--primary-color', parsedSettings.primary_color);
          // Convert hex to HSL for CSS variables if needed
          const hsl = hexToHsl(parsedSettings.primary_color);
          if (hsl) {
            document.documentElement.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
          }
        }
        if (parsedSettings.secondary_color) {
          document.documentElement.style.setProperty('--secondary-color', parsedSettings.secondary_color);
          const hsl = hexToHsl(parsedSettings.secondary_color);
          if (hsl) {
            document.documentElement.style.setProperty('--primary-dark', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
          }
        }
      } else {
        // No settings found, use defaults
        setSettings({
          ...DEFAULT_SETTINGS,
          agency_id: profile?.agency_id || '550e8400-e29b-41d4-a716-446655440000',
        } as AgencySettings);
      }
    } catch (err: any) {
      console.error('Error fetching agency settings:', err);
      setError(err.message || 'Failed to fetch agency settings');
      // Use defaults on error
      setSettings({
        ...DEFAULT_SETTINGS,
        agency_id: profile?.agency_id || '550e8400-e29b-41d4-a716-446655440000',
      } as AgencySettings);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<AgencySettings>) => {
    try {
      setError(null);
      
      // Only include fields that are actually provided (not undefined)
      const settingsToSave: any = {};
      
      // Copy only defined fields, but exclude large logo_url unless it's actually new
      Object.keys(newSettings).forEach(key => {
        const value = (newSettings as any)[key];
        
        // Special handling for logo_url: only include if it's a new/changed value
        // Don't send existing large base64 strings that haven't changed
        if (key === 'logo_url') {
          // Only include logo_url if:
          // 1. It's explicitly provided (not undefined/null)
          // 2. It's different from the existing value
          // 3. It's not an extremely large base64 string (> 1MB uncompressed)
          if (value !== undefined && value !== null && value !== '') {
            const existingLogo = settings?.logo_url;
            // If it's different from existing, include it
            if (value !== existingLogo) {
              // Check if it's a reasonable size (base64 is ~33% larger than binary)
              // If it's a data URL and larger than 1.5MB, it might cause issues
              if (typeof value === 'string' && value.startsWith('data:')) {
                const base64Length = value.length;
                // Approximate: base64 is ~4/3 the size of binary, so 1.5MB binary = ~2MB base64
                if (base64Length > 2 * 1024 * 1024) {
                  console.warn('Logo URL is very large, but including it anyway. Consider compressing the image.');
                }
              }
              settingsToSave[key] = value;
            }
            // If it's the same as existing, don't include it (saves bandwidth)
          } else if (value === '') {
            // Explicitly setting to empty string means remove logo
            settingsToSave[key] = '';
          }
        } else if (value !== undefined && value !== null) {
          settingsToSave[key] = value;
        }
      });

      // Ensure working_days is stored as JSON string if provided
      if (newSettings.working_days !== undefined) {
        settingsToSave.working_days = typeof newSettings.working_days === 'string' 
          ? newSettings.working_days 
          : JSON.stringify(newSettings.working_days || DEFAULT_SETTINGS.working_days);
      }

      // Also save as currency for backward compatibility if default_currency is provided
      if (newSettings.default_currency) {
        settingsToSave.currency = newSettings.default_currency;
      } else if (newSettings.currency) {
        settingsToSave.currency = newSettings.currency;
      }

      if (settings?.id) {
        // Update existing settings
        const updated = await updateRecord<AgencySettings>(
          'agency_settings',
          settingsToSave,
          { id: settings.id }
        );
        setSettings(updated);
      } else {
        // Insert new settings
        const inserted = await insertRecord<AgencySettings>('agency_settings', {
          ...settingsToSave,
          agency_id: profile?.agency_id || settings?.agency_id || '550e8400-e29b-41d4-a716-446655440000',
        });
        setSettings(inserted);
      }

      // Apply theme colors immediately
      if (newSettings.primary_color) {
        document.documentElement.style.setProperty('--primary-color', newSettings.primary_color);
        const hsl = hexToHsl(newSettings.primary_color);
        if (hsl) {
          document.documentElement.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
        }
      }
      if (newSettings.secondary_color) {
        document.documentElement.style.setProperty('--secondary-color', newSettings.secondary_color);
        const hsl = hexToHsl(newSettings.secondary_color);
        if (hsl) {
          document.documentElement.style.setProperty('--primary-dark', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
        }
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error saving agency settings:', err);
      setError(err.message || 'Failed to save agency settings');
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [profile?.agency_id]);

  return {
    settings,
    loading,
    error,
    fetchSettings,
    saveSettings,
  };
};

// Helper function to convert hex to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

