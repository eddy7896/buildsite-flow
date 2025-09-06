import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
}

export interface RolePermission {
  role: string;
  permission_id: string;
  granted: boolean;
}

export function usePermissions() {
  const { userRole } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    try {
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .eq('is_active', true)
        .order('category, name');

      if (permissionsError) throw permissionsError;
      setPermissions(permissionsData || []);

      // Fetch role permissions for current user's role
      if (userRole) {
        const { data: rolePermData, error: rolePermError } = await supabase
          .from('role_permissions')
          .select('*')
          .eq('role', userRole);

        if (rolePermError) throw rolePermError;
        setRolePermissions(rolePermData || []);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [userRole]);

  const hasPermission = (permissionName: string): boolean => {
    const permission = permissions.find(p => p.name === permissionName);
    if (!permission) return false;

    const rolePermission = rolePermissions.find(rp => rp.permission_id === permission.id);
    return rolePermission?.granted || false;
  };

  const checkPermission = async (permissionName: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('has_permission', {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        permission_name: permissionName
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  return {
    permissions,
    rolePermissions,
    loading,
    hasPermission,
    checkPermission,
    refetch: fetchPermissions
  };
}