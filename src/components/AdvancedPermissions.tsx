import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { db } from '@/lib/database';
import { toast } from 'sonner';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  is_enabled: boolean;
  required_roles: string[];
  required_permissions: string[];
  metadata: any;
}

export function AdvancedPermissions() {
  const { userRole } = useAuth();
  const { permissions, rolePermissions, loading } = usePermissions();
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(true);

  const canManagePermissions = userRole === 'super_admin';

  const fetchFeatureFlags = async () => {
    try {
      const { data, error } = await db
        .from('feature_flags')
        .select('*')
        .order('name');

      // Handle missing table gracefully
      if (error) {
        const errorMessage = error.message || String(error);
        // Check for missing table error (42P01 is PostgreSQL error code for "undefined_table")
        if (errorMessage.includes('does not exist') || errorMessage.includes('42P01') || 
            (errorMessage.includes('Database API error') && errorMessage.includes('relation'))) {
          console.warn('feature_flags table does not exist yet - feature not implemented');
          setFeatureFlags([]);
          setFlagsLoading(false);
          return;
        }
        throw error;
      }
      setFeatureFlags(data || []);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      toast.error('Failed to load feature flags');
    } finally {
      setFlagsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatureFlags();
  }, []);

  const toggleFeatureFlag = async (flagId: string, enabled: boolean) => {
    if (!canManagePermissions) return;

    try {
      const { error } = await db
        .from('feature_flags')
        .update({ is_enabled: enabled })
        .eq('id', flagId);

      if (error) throw error;

      setFeatureFlags(prev => prev.map(flag => 
        flag.id === flagId ? { ...flag, is_enabled: enabled } : flag
      ));

      toast.success(`Feature flag ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Error updating feature flag:', error);
      toast.error('Failed to update feature flag');
    }
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, typeof permissions>);

  const hasRolePermission = (permissionId: string) => {
    return rolePermissions.some(rp => rp.permission_id === permissionId && rp.granted);
  };

  if (loading || flagsLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Permissions</h1>
          <p className="text-muted-foreground">Manage granular permissions and feature flags</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Your Role: {userRole}</span>
        </div>
      </div>

      <Tabs defaultValue="permissions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="permissions">Current Permissions</TabsTrigger>
          <TabsTrigger value="feature-flags">Feature Flags</TabsTrigger>
          {canManagePermissions && <TabsTrigger value="manage">Manage System</TabsTrigger>}
        </TabsList>

        <TabsContent value="permissions">
          <div className="grid gap-6">
            {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="capitalize">{category} Permissions</CardTitle>
                  <CardDescription>
                    Permissions related to {category} functionality
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {categoryPermissions.map((permission) => (
                      <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{permission.name.replace(/_/g, ' ').toUpperCase()}</h4>
                            {hasRolePermission(permission.id) ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Lock className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{permission.description}</p>
                        </div>
                        <Badge variant={hasRolePermission(permission.id) ? 'default' : 'secondary'}>
                          {hasRolePermission(permission.id) ? 'Granted' : 'Denied'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="feature-flags">
          <div className="grid gap-4">
            {featureFlags.map((flag) => (
              <Card key={flag.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{flag.name.replace(/_/g, ' ').toUpperCase()}</span>
                        {flag.is_enabled ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-gray-600" />
                        )}
                      </CardTitle>
                      <CardDescription>{flag.description}</CardDescription>
                    </div>
                    {canManagePermissions && (
                      <Switch
                        checked={flag.is_enabled}
                        onCheckedChange={(checked) => toggleFeatureFlag(flag.id, checked)}
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Required Roles</h4>
                      <div className="flex flex-wrap gap-2">
                        {flag.required_roles.map((role) => (
                          <Badge key={role} variant="outline">
                            {role.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {flag.required_permissions.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Required Permissions</h4>
                        <div className="flex flex-wrap gap-2">
                          {flag.required_permissions.map((permission) => (
                            <Badge key={permission} variant="secondary">
                              {permission.replace(/_/g, ' ').toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <Badge variant={flag.is_enabled ? 'default' : 'secondary'}>
                        {flag.is_enabled ? 'ENABLED' : 'DISABLED'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {canManagePermissions && (
          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>System Administration</span>
                </CardTitle>
                <CardDescription>
                  Advanced system management capabilities for super administrators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Permission Management</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Control which roles have access to specific system features
                  </p>
                  <Button variant="outline" disabled>
                    Coming Soon - Advanced Permission Editor
                  </Button>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Audit & Compliance</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    View detailed audit logs and compliance reports
                  </p>
                  <Button variant="outline" disabled>
                    Coming Soon - Audit Dashboard
                  </Button>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Security Monitoring</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Monitor system security and access patterns
                  </p>
                  <Button variant="outline" disabled>
                    Coming Soon - Security Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}