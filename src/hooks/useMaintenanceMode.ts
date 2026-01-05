/**
 * Hook to check agency-specific maintenance mode status
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getAgencyDatabase } from '@/utils/authContext';

interface MaintenanceStatus {
  maintenance_mode: boolean;
  maintenance_message: string | null;
}

export function useMaintenanceMode() {
  const { user, userRole, isSystemSuperAdmin } = useAuth();
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Super admins bypass maintenance mode check
    if (isSystemSuperAdmin || userRole === 'super_admin') {
      setMaintenanceStatus({ maintenance_mode: false, maintenance_message: null });
      setLoading(false);
      return;
    }

    // Check agency-specific maintenance mode from API
    const checkMaintenanceMode = async () => {
      try {
        const agencyDatabase = getAgencyDatabase();
        if (!agencyDatabase) {
          // No agency database means user is not logged into an agency
          setMaintenanceStatus({ maintenance_mode: false, maintenance_message: null });
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('token');
        const response = await fetch('/api/agencies/maintenance-status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-agency-database': agencyDatabase,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        });

        if (response.status === 503) {
          // Maintenance mode is active
          const data = await response.json();
          setMaintenanceStatus({
            maintenance_mode: true,
            maintenance_message: data.message || data.error?.message || null,
          });
        } else if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setMaintenanceStatus({
              maintenance_mode: data.data.maintenance_mode || false,
              maintenance_message: data.data.maintenance_message || null,
            });
          } else {
            setMaintenanceStatus({ maintenance_mode: false, maintenance_message: null });
          }
        } else {
          // Assume no maintenance mode if check fails
          setMaintenanceStatus({ maintenance_mode: false, maintenance_message: null });
        }
      } catch (error) {
        // On error, assume no maintenance mode (fail open)
        console.warn('[Maintenance] Could not check maintenance mode:', error);
        setMaintenanceStatus({ maintenance_mode: false, maintenance_message: null });
      } finally {
        setLoading(false);
      }
    };

    checkMaintenanceMode();
    
    // Check every 30 seconds
    const interval = setInterval(checkMaintenanceMode, 30000);
    return () => clearInterval(interval);
  }, [user, userRole, isSystemSuperAdmin]);

  return {
    maintenanceMode: maintenanceStatus?.maintenance_mode || false,
    maintenanceMessage: maintenanceStatus?.maintenance_message,
    loading,
  };
}
