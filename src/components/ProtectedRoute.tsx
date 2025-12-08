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
  requiredRole?: AppRole | AppRole[];
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

  if (requiredRole && userRole) {
    let hasAccess = false;
    
    // Handle array of roles
    if (Array.isArray(requiredRole)) {
      // User has access if their role is in the array OR if they have higher authority than any role in the array
      hasAccess = requiredRole.includes(userRole) || 
                  requiredRole.some(role => hasRoleOrHigher(userRole, role));
    } 
    // Handle single role
    else {
      hasAccess = hasRoleOrHigher(userRole, requiredRole);
    }
    
    if (!hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;