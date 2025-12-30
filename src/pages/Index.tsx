import { useAuth } from '@/hooks/useAuth';
import { RoleDashboard } from '@/components/dashboards/RoleDashboard';
import { AppRole } from '@/utils/roleUtils';
import { Navigate } from 'react-router-dom';

const Index = () => {
  const { userRole, isSystemSuperAdmin } = useAuth();
  
  // Redirect super admins to super admin dashboard
  if (userRole === 'super_admin' && isSystemSuperAdmin) {
    return <Navigate to="/super-admin" replace />;
  }
  
  // Redirect agency admins to agency dashboard
  if (userRole === 'admin' && !isSystemSuperAdmin) {
    return <Navigate to="/agency" replace />;
  }
  
  // Use role-specific dashboard for other roles
  const role = (userRole as AppRole) || 'employee';
  
  return <RoleDashboard role={role} />;
};

export default Index;
