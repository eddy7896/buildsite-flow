import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { hasRoleOrHigher, hasFinancialAccess, canManageUserRoles } from '@/utils/roleUtils';
import type { AppRole } from '@/utils/roleUtils';

interface RoleGuardProps {
  children: ReactNode;
  requiredRole?: AppRole;
  requireFinancialAccess?: boolean;
  requireUserManagement?: boolean;
  fallback?: ReactNode;
}

/**
 * Component-level role guard for conditional rendering
 */
export function RoleGuard({ 
  children, 
  requiredRole, 
  requireFinancialAccess = false,
  requireUserManagement = false,
  fallback = null 
}: RoleGuardProps) {
  const { userRole, loading } = useAuth();

  if (loading) {
    return <>{fallback}</>;
  }

  if (!userRole) {
    return <>{fallback}</>;
  }

  // Check specific role requirement
  if (requiredRole && !hasRoleOrHigher(userRole, requiredRole)) {
    return <>{fallback}</>;
  }

  // Check financial access requirement
  if (requireFinancialAccess && !hasFinancialAccess(userRole)) {
    return <>{fallback}</>;
  }

  // Check user management requirement
  if (requireUserManagement && !canManageUserRoles(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}