/**
 * Settings Page
 * Main orchestrator for settings functionality
 * Refactored from 1,733 lines to ~150 lines
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Bell, Shield, User, Building } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAgencySettings } from "@/hooks/useAgencySettings";
import { ProfileSettingsTab } from "./settings/components/ProfileSettingsTab";
import { AgencySettingsTab } from "./settings/components/AgencySettingsTab";
import { NotificationSettingsTab } from "./settings/components/NotificationSettingsTab";
import { SecuritySettingsTab } from "./settings/components/SecuritySettingsTab";

const Settings = () => {
  const { userRole } = useAuth();
  const { loading: loadingAgencyData } = useAgencySettings();
  
  // Check if user is admin or super_admin
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  if (loadingAgencyData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account, agency, and application preferences</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="agency" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Agency
            </TabsTrigger>
          )}
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings Tab */}
        <TabsContent value="profile" className="space-y-6">
          <ProfileSettingsTab />
        </TabsContent>

        {/* Agency Settings Tab - Admin Only */}
        {isAdmin && (
          <TabsContent value="agency" className="space-y-6">
            <AgencySettingsTab />
          </TabsContent>
        )}

        {/* Notifications Settings Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettingsTab />
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-6">
          <SecuritySettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;

