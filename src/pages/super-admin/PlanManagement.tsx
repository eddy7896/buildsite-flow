/**
 * Plan Management Page for Super Admin
 */

import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import PlanManagement from '@/components/system/PlanManagement';
import { PageContainer } from '@/components/layout/PageContainer';

const PlanManagementPage = () => {
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
          <h1 className="text-3xl font-bold">Plan Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage subscription plans and features
          </p>
        </div>
        <PlanManagement />
      </div>
    </PageContainer>
  );
};

export default PlanManagementPage;

