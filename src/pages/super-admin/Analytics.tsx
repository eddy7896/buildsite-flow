/**
 * System Analytics Page for Super Admin
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useSystemAnalytics } from '@/hooks/useSystemAnalytics';
import { SystemDashboardCharts } from '@/components/system/SystemDashboardCharts';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const Analytics = () => {
  const { user, userRole, isSystemSuperAdmin } = useAuth();
  
  if (!isSystemSuperAdmin && userRole !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { metrics, loading } = useSystemAnalytics({
    userId: user.id,
    userRole: userRole || ''
  });

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Platform-wide analytics and insights
          </p>
        </div>
        
        {loading && !metrics ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ) : metrics ? (
          <SystemDashboardCharts metrics={metrics} />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No analytics data available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};

export default Analytics;

