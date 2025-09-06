import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Save, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GstSettings {
  id?: string;
  gstin: string;
  legal_name: string;
  trade_name?: string;
  business_type: string;
  filing_frequency: string;
  composition_scheme: boolean;
}

interface GstSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingSettings?: GstSettings | null;
  onSave: (settings: GstSettings) => void;
}

export const GstSettingsDialog: React.FC<GstSettingsDialogProps> = ({ 
  open, 
  onOpenChange, 
  existingSettings, 
  onSave 
}) => {
  console.log('GstSettingsDialog props:', { open, onOpenChange });
  
  const { user } = useAuth();
  console.log('User in GstSettingsDialog:', user);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<GstSettings>({
    gstin: '',
    legal_name: '',
    trade_name: '',
    business_type: 'regular',
    filing_frequency: 'monthly',
    composition_scheme: false
  });

  // Debug logging for dialog state changes
  useEffect(() => {
    console.log('GstSettingsDialog - open prop changed:', open);
    console.log('GstSettingsDialog - component mounted/updated');
  }, [open]);

  console.log('GstSettingsDialog rendering - open:', open);

  useEffect(() => {
    if (existingSettings) {
      setFormData({
        id: existingSettings.id,
        gstin: existingSettings.gstin || '',
        legal_name: existingSettings.legal_name || '',
        trade_name: existingSettings.trade_name || '',
        business_type: existingSettings.business_type || 'regular',
        filing_frequency: existingSettings.filing_frequency || 'monthly',
        composition_scheme: existingSettings.composition_scheme || false
      });
    } else {
      setFormData({
        gstin: '',
        legal_name: '',
        trade_name: '',
        business_type: 'regular',
        filing_frequency: 'monthly',
        composition_scheme: false
      });
    }
  }, [existingSettings, open]);

  const validateGSTIN = (gstin: string): boolean => {
    // GSTIN format: 15 characters, alphanumeric
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }

    // Validation
    if (!formData.gstin || !formData.legal_name) {
      toast({
        title: "Validation Error",
        description: "GSTIN and Legal Name are required",
        variant: "destructive"
      });
      return;
    }

    if (!validateGSTIN(formData.gstin)) {
      toast({
        title: "Invalid GSTIN",
        description: "Please enter a valid 15-character GSTIN",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get user's agency ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile?.agency_id) {
        toast({
          title: "Error",
          description: "User agency not found. Please contact support.",
          variant: "destructive"
        });
        return;
      }

      const settingsData = {
        gstin: formData.gstin.toUpperCase(),
        legal_name: formData.legal_name,
        trade_name: formData.trade_name || null,
        business_type: formData.business_type,
        filing_frequency: formData.filing_frequency,
        composition_scheme: formData.composition_scheme,
        agency_id: profile.agency_id,
        is_active: true
      };

      if (existingSettings?.id) {
        // Update existing settings
        const { error } = await supabase
          .from('gst_settings')
          .update(settingsData)
          .eq('id', existingSettings.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('gst_settings')
          .insert(settingsData)
          .select()
          .single();

        if (error) throw error;
        
        setFormData(prev => ({ ...prev, id: data.id }));
      }

      toast({
        title: "Success",
        description: "GST settings saved successfully",
      });

      onSave({ ...formData, id: existingSettings?.id || 'new' });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving GST settings:', error);
      toast({
        title: "Error",
        description: "Failed to save GST settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  
  
  console.log('GstSettingsDialog: rendering with open =', open);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl z-[9999]">
        <DialogHeader>
          <DialogTitle>
            {existingSettings ? 'Update GST Settings' : 'Configure GST Settings'}
          </DialogTitle>
          <DialogDescription>
            Configure your GST details to enable compliance features and tax calculations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Configure your GST details to enable compliance features and tax calculations.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN *</Label>
              <Input
                id="gstin"
                value={formData.gstin}
                onChange={(e) => setFormData(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                placeholder="27AAECE4266K1ZR"
                maxLength={15}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                15-character GST Identification Number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal_name">Legal Name *</Label>
              <Input
                id="legal_name"
                value={formData.legal_name}
                onChange={(e) => setFormData(prev => ({ ...prev, legal_name: e.target.value }))}
                placeholder="ABC Private Limited"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trade_name">Trade Name (Optional)</Label>
            <Input
              id="trade_name"
              value={formData.trade_name}
              onChange={(e) => setFormData(prev => ({ ...prev, trade_name: e.target.value }))}
              placeholder="ABC Company"
            />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_type">Business Type</Label>
              <Select
                value={formData.business_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, business_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Business</SelectItem>
                  <SelectItem value="composition">Composition Scheme</SelectItem>
                  <SelectItem value="casual">Casual Taxable Person</SelectItem>
                  <SelectItem value="non_resident">Non-Resident Taxable Person</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filing_frequency">Filing Frequency</Label>
              <Select
                value={formData.filing_frequency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, filing_frequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="composition_scheme"
              checked={formData.composition_scheme}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, composition_scheme: checked }))}
            />
            <Label htmlFor="composition_scheme">Composition Scheme Taxpayer</Label>
          </div>

          {formData.composition_scheme && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Composition scheme taxpayers have different filing requirements and tax rates.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};