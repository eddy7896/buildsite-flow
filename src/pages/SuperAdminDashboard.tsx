/**
 * Legacy SuperAdminDashboard Component
 * DEPRECATED: This component is replaced by the new super admin dashboard at /super-admin
 * 
 * This component redirects to the new isolated super admin dashboard which:
 * - Only connects to main database (buildflow_db)
 * - Manages agencies, system settings, plans, and page catalog
 * - Provides read-only access to agency data
 * - Has no agency context
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function SuperAdminDashboard() {
  const { userRole, isSystemSuperAdmin } = useAuth();
  
  // Redirect to new super admin dashboard
  if (isSystemSuperAdmin || userRole === 'super_admin') {
    return <Navigate to="/super-admin" replace />;
  }
  
  // If not super admin, redirect to dashboard
  return <Navigate to="/dashboard" replace />;
}
