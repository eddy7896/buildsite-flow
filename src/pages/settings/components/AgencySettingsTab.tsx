/**
 * Agency Settings Tab Component
 * Note: This is a large component with multiple sections
 * For full implementation, see Settings.original.tsx lines 966-1299
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Building, Palette, Globe, Clock, DollarSign, Loader2, Wrench } from "lucide-react";
import { useAgencySettingsExtended } from '../hooks/useAgencySettings';
import { useCurrency } from "@/hooks/useCurrency";
import { LogoUpload } from './LogoUpload';
import { COLOR_PRESETS, TIMEZONES, DATE_FORMATS, FISCAL_YEAR_OPTIONS, WEEKDAYS } from '../utils/settingsConstants';
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export const AgencySettingsTab = () => {
  const { availableCurrencies } = useCurrency();
  const { toast } = useToast();
  const {
    agencySettings,
    setAgencySettings,
    loading,
    logoFile,
    setLogoFile,
    logoPreview,
    setLogoPreview,
    saveAgencySettings,
  } = useAgencySettingsExtended();
  
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  const applyColorPreset = (preset: { primary: string; secondary: string }) => {
    setAgencySettings(prev => ({
      ...prev,
      primary_color: preset.primary,
      secondary_color: preset.secondary,
    }));
  };

  const toggleWorkingDay = (day: string) => {
    setAgencySettings(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day],
    }));
  };

  const handleLogoChange = (file: File | null, preview: string) => {
    setLogoFile(file);
    setLogoPreview(preview);
  };

  const removeLogoPreview = () => {
    setLogoFile(null);
    setLogoPreview('');
    setAgencySettings(prev => ({ ...prev, logo_url: '' }));
  };

  // Load maintenance status on mount
  useEffect(() => {
    const loadMaintenanceStatus = async () => {
      try {
        const agencyDatabase = localStorage.getItem('agencyDatabase');
        if (!agencyDatabase) return;

        const response = await fetch('/api/agencies/maintenance-status', {
          headers: {
            'Content-Type': 'application/json',
            'x-agency-database': agencyDatabase,
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setMaintenanceMode(data.data.maintenance_mode || false);
            setMaintenanceMessage(data.data.maintenance_message || '');
          }
        }
      } catch (error) {
        console.error('Error loading maintenance status:', error);
      }
    };

    loadMaintenanceStatus();
  }, []);

  const handleSaveMaintenance = async () => {
    try {
      setMaintenanceLoading(true);
      const agencyDatabase = localStorage.getItem('agencyDatabase');
      if (!agencyDatabase) {
        toast({
          title: 'Error',
          description: 'Agency database not found',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch('/api/agencies/maintenance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-agency-database': agencyDatabase,
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          maintenance_mode: maintenanceMode,
          maintenance_message: maintenanceMessage || null,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Success',
          description: `Maintenance mode ${maintenanceMode ? 'enabled' : 'disabled'} successfully`,
        });
      } else {
        throw new Error(data.message || 'Failed to update maintenance mode');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update maintenance mode',
        variant: 'destructive',
      });
    } finally {
      setMaintenanceLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Agency Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Agency Information
          </CardTitle>
          <CardDescription>Configure your agency's basic information and branding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agencyName">Agency Name</Label>
              <Input
                id="agencyName"
                value={agencySettings.agency_name}
                onChange={(e) => setAgencySettings(prev => ({ ...prev, agency_name: e.target.value }))}
                placeholder="Enter your agency name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agencyDomain">Email Domain</Label>
              <Input
                id="agencyDomain"
                value={agencySettings.domain}
                onChange={(e) => setAgencySettings(prev => ({ ...prev, domain: e.target.value }))}
                placeholder="company.com (without @)"
              />
              <p className="text-xs text-muted-foreground">
                Used for auto-generating employee email addresses
              </p>
            </div>
          </div>

          <LogoUpload
            logoPreview={logoPreview}
            onLogoChange={handleLogoChange}
            onRemove={removeLogoPreview}
          />
        </CardContent>
      </Card>

      {/* Branding & Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Branding & Theme
          </CardTitle>
          <CardDescription>Customize your agency's color scheme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Quick Color Presets</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => applyColorPreset(preset)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <span className="text-sm">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={agencySettings.primary_color}
                  onChange={(e) => setAgencySettings(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={agencySettings.primary_color}
                  onChange={(e) => setAgencySettings(prev => ({ ...prev, primary_color: e.target.value }))}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={agencySettings.secondary_color}
                  onChange={(e) => setAgencySettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={agencySettings.secondary_color}
                  onChange={(e) => setAgencySettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                  placeholder="#1e40af"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded text-white transition-colors"
                style={{ backgroundColor: agencySettings.primary_color }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 rounded text-white transition-colors"
                style={{ backgroundColor: agencySettings.secondary_color }}
              >
                Secondary Button
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional & Financial Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Regional & Financial Settings
          </CardTitle>
          <CardDescription>Configure timezone, currency, and fiscal settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">Default Currency</Label>
              <Select
                value={agencySettings.default_currency}
                onValueChange={(value) => setAgencySettings(prev => ({ ...prev, default_currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency">
                    {availableCurrencies[agencySettings.default_currency] ? (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>
                          {availableCurrencies[agencySettings.default_currency].symbol} {availableCurrencies[agencySettings.default_currency].code}
                        </span>
                      </div>
                    ) : (
                      <span>Select currency</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(availableCurrencies)
                    .filter(([key]) => key !== 'default')
                    .map(([countryCode, currency]) => (
                      <SelectItem key={countryCode} value={countryCode}>
                        <div className="flex items-center gap-2">
                          <span>{currency.symbol}</span>
                          <span>{currency.code}</span>
                          <span className="text-muted-foreground">- {currency.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={agencySettings.timezone}
                onValueChange={(value) => setAgencySettings(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select
                value={agencySettings.date_format}
                onValueChange={(value) => setAgencySettings(prev => ({ ...prev, date_format: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map(fmt => (
                    <SelectItem key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscalYearStart">Fiscal Year Start</Label>
              <Select
                value={agencySettings.fiscal_year_start}
                onValueChange={(value) => setAgencySettings(prev => ({ ...prev, fiscal_year_start: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fiscal year start" />
                </SelectTrigger>
                <SelectContent>
                  {FISCAL_YEAR_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Working Hours & Days */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Working Hours & Days
          </CardTitle>
          <CardDescription>Configure default working schedule for the organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workingHoursStart">Working Hours Start</Label>
              <Input
                id="workingHoursStart"
                type="time"
                value={agencySettings.working_hours_start}
                onChange={(e) => setAgencySettings(prev => ({ ...prev, working_hours_start: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workingHoursEnd">Working Hours End</Label>
              <Input
                id="workingHoursEnd"
                type="time"
                value={agencySettings.working_hours_end}
                onChange={(e) => setAgencySettings(prev => ({ ...prev, working_hours_end: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Working Days</Label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map(day => (
                <button
                  key={day.value}
                  onClick={() => toggleWorkingDay(day.value)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    agencySettings.working_days.includes(day.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={saveAgencySettings} disabled={loading} className="w-full md:w-auto">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Agency Settings
          </Button>
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Maintenance Mode
          </CardTitle>
          <CardDescription>
            Temporarily disable access for all agency users (except admins)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance_mode">Enable Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Show maintenance message to all agency users
              </p>
            </div>
            <Switch
              id="maintenance_mode"
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
          </div>
          {maintenanceMode && (
            <div className="space-y-2">
              <Label htmlFor="maintenance_message">Maintenance Message</Label>
              <Textarea
                id="maintenance_message"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="We're currently performing scheduled maintenance. Please check back soon."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This message will be displayed to all agency users when maintenance mode is enabled.
              </p>
            </div>
          )}
          <Button 
            onClick={handleSaveMaintenance} 
            disabled={maintenanceLoading}
            variant={maintenanceMode ? "destructive" : "default"}
            className="w-full md:w-auto"
          >
            {maintenanceLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Maintenance Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

