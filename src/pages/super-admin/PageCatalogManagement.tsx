/**
 * Page Catalog Management Page for Super Admin
 */

import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import PageCatalogManagement from '@/components/system/PageCatalogManagement';
import { PageContainer } from '@/components/layout/PageContainer';

const PageCatalogManagementPage = () => {
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
          <h1 className="text-3xl font-bold">Page Catalog Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage available pages and page assignments
          </p>
        </div>
        <PageCatalogManagement />
      </div>
    </PageContainer>
  );
};

export default PageCatalogManagementPage;

