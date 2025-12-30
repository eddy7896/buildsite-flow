/**
 * System Settings Page for Super Admin
 */

import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { SystemSettings as SystemSettingsComponent } from '@/components/system/SystemSettings';
import { PageContainer } from '@/components/layout/PageContainer';

const SystemSettings = () => {
  const { user, userRole, isSystemSuperAdmin } = useAuth();
  
  if (!isSystemSuperAdmin && userRole !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure system-wide settings, branding, and features
          </p>
        </div>
        <SystemSettingsComponent />
      </div>
    </PageContainer>
  );
};

export default SystemSettings;

