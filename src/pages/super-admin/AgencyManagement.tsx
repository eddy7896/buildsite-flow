/**
 * Agency Management Page for Super Admin
 * Manages all agencies from main database
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { AgencyManagement as AgencyManagementComponent } from '@/components/system/AgencyManagement';
import { useSystemAnalytics } from '@/hooks/useSystemAnalytics';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const AgencyManagement = () => {
  const { user, userRole, isSystemSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Redirect if not system super admin
  if (!isSystemSuperAdmin && userRole !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Show loading while auth is being determined
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only initialize analytics after authentication is confirmed
  const { agencies, loading, refreshMetrics } = useSystemAnalytics({
    userId: user.id,
    userRole: userRole || ''
  });

  const handleCreateAgency = () => {
    // Navigate to agency creation page or open dialog
    navigate('/agency-signup');
    toast({
      title: "Create New Agency",
      description: "Redirecting to agency signup page..."
    });
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agency Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage all agencies, view details, and configure settings
            </p>
          </div>
          <Button onClick={handleCreateAgency}>
            <Plus className="mr-2 h-4 w-4" />
            Create Agency
          </Button>
        </div>

        {/* Agency Management Component */}
        {loading && !agencies ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <AgencyManagementComponent 
            agencies={agencies || []} 
            onRefresh={refreshMetrics} 
          />
        )}
      </div>
    </PageContainer>
  );
};

export default AgencyManagement;

