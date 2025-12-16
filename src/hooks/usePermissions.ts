import { useState, useEffect } from 'react';
import { db } from '@/lib/database';
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
      const { data: permissionsData, error: permissionsError } = await db
        .from('permissions')
        .select('*')
        .eq('is_active', true)
        .order('category, name');

      // Handle missing table gracefully
      if (permissionsError) {
        const errorMessage = permissionsError.message || String(permissionsError);
        // Check for missing table error (42P01 is PostgreSQL error code for "undefined_table")
        if (errorMessage.includes('does not exist') || errorMessage.includes('42P01') || 
            (errorMessage.includes('Database API error') && errorMessage.includes('relation'))) {
          console.warn('permissions table does not exist yet - feature not implemented');
          setPermissions([]);
          setRolePermissions([]);
          setLoading(false);
          return;
        }
        throw permissionsError;
      }
      setPermissions(permissionsData || []);

      // Fetch role permissions for current user's role
      if (userRole) {
        const { data: rolePermData, error: rolePermError } = await db
          .from('role_permissions')
          .select('*')
          .eq('role', userRole);

        // Handle missing table gracefully
        if (rolePermError) {
          const errorMessage = rolePermError.message || String(rolePermError);
          if (errorMessage.includes('does not exist') || errorMessage.includes('42P01') || 
              (errorMessage.includes('Database API error') && errorMessage.includes('relation'))) {
            console.warn('role_permissions table does not exist yet - feature not implemented');
            setRolePermissions([]);
          } else {
            throw rolePermError;
          }
        } else {
          setRolePermissions(rolePermData || []);
        }
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

  const { user } = useAuth();
  
  const checkPermission = async (permissionName: string): Promise<boolean> => {
    try {
      if (!user?.id) return false;
      
      const { data, error } = await db.rpc('has_permission', {
        p_user_id: user.id,
        p_permission: permissionName
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