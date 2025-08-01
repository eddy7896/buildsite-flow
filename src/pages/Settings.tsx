import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Save, Bell, Shield, User, Building, Upload, X } from "lucide-react";

const Settings = () => {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const [agencySettings, setAgencySettings] = useState({
    agency_name: '',
    logo_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  useEffect(() => {
    fetchAgencySettings();
  }, []);

  const fetchAgencySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('agency_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching agency settings:', error);
        return;
      }

      if (data) {
        setAgencySettings({
          agency_name: data.agency_name || '',
          logo_url: data.logo_url || ''
        });
        setLogoPreview(data.logo_url || '');
      }
    } catch (error) {
      console.error('Error fetching agency settings:', error);
    }
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Logo file size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogoPreview = () => {
    setLogoFile(null);
    setLogoPreview('');
    setAgencySettings(prev => ({ ...prev, logo_url: '' }));
  };

  const saveAgencySettings = async () => {
    if (userRole !== 'admin') {
      toast({
        title: "Error",
        description: "Only admins can update agency settings",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let logoUrl = agencySettings.logo_url;

      // If a new logo file is selected, we would typically upload it to storage
      // For now, we'll use the preview URL (in a real app, you'd upload to Supabase Storage)
      if (logoFile) {
        logoUrl = logoPreview; // In production, this would be the uploaded file URL
      }

      // Try to update existing settings first
      const { data: existingData } = await supabase
        .from('agency_settings')
        .select('id')
        .limit(1)
        .single();

      if (existingData) {
        // Update existing settings
        const { error } = await supabase
          .from('agency_settings')
          .update({
            agency_name: agencySettings.agency_name,
            logo_url: logoUrl
          })
          .eq('id', existingData.id);

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from('agency_settings')
          .insert({
            agency_name: agencySettings.agency_name,
            logo_url: logoUrl
          });

        if (error) throw error;
      }

      setAgencySettings(prev => ({ ...prev, logo_url: logoUrl }));
      setLogoFile(null);

      toast({
        title: "Success",
        description: "Agency settings updated successfully",
      });
    } catch (error) {
      console.error('Error saving agency settings:', error);
      toast({
        title: "Error",
        description: "Failed to update agency settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and application preferences</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Agency Settings - Only for Admins */}
        {userRole === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Agency Settings
              </CardTitle>
              <CardDescription>Configure your agency's name and logo displayed in the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Label htmlFor="logoUpload">Agency Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      id="logoUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a logo (PNG, JPG, SVG - Max 5MB)
                    </p>
                  </div>
                  {logoPreview && (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-16 h-16 object-contain border rounded"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 w-6 h-6 p-0"
                        onClick={removeLogoPreview}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <Button onClick={saveAgencySettings} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Saving..." : "Save Agency Settings"}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" defaultValue="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" defaultValue="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="john@company.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" defaultValue="+1 (555) 123-4567" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch id="emailNotifications" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="pushNotifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
              </div>
              <Switch id="pushNotifications" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="taskReminders">Task Reminders</Label>
                <p className="text-sm text-muted-foreground">Get reminded about upcoming tasks</p>
              </div>
              <Switch id="taskReminders" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" />
            </div>
            <Button variant="outline">Change Password</Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;