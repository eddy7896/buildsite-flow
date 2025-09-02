import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { hasRoleOrHigher } from '@/utils/roleUtils';
import { Loader2 } from 'lucide-react';

type AppRole = 'super_admin' | 'ceo' | 'cto' | 'cfo' | 'coo' | 'admin' | 'operations_manager' | 
  'department_head' | 'team_lead' | 'project_manager' | 'hr' | 'finance_manager' | 'sales_manager' |
  'marketing_manager' | 'quality_assurance' | 'it_support' | 'legal_counsel' | 'business_analyst' |
  'customer_success' | 'employee' | 'contractor' | 'intern';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && userRole && !hasRoleOrHigher(userRole, requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;