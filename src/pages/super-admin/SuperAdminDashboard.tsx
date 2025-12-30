/**
 * Super Admin Dashboard
 * Main dashboard for system-level super admin
 * Manages agencies, system settings, plans, and page catalog
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSystemAnalytics } from '@/hooks/useSystemAnalytics';
import { Navigate, useNavigate } from 'react-router-dom';
import { SystemMetricsCards } from '@/components/system/SystemMetricsCards';
import { SystemDashboardCharts } from '@/components/system/SystemDashboardCharts';
import { SupportTicketsWidget } from '@/components/system/SupportTicketsWidget';
import { RealTimeUsageWidget } from '@/components/system/RealTimeUsageWidget';
import { RefreshCw, AlertTriangle, CheckCircle, TrendingUp, Building2, Settings, CreditCard, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PageContainer } from '@/components/layout/PageContainer';

const SuperAdminDashboard = () => {
  const { user, userRole, isSystemSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
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
  const { metrics, agencies, loading, refreshMetrics } = useSystemAnalytics({
    userId: user.id,
    userRole: userRole || ''
  });

  useEffect(() => {
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      refreshMetrics();
      setLastRefresh(new Date());
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshMetrics]);

  const handleManualRefresh = () => {
    refreshMetrics();
    setLastRefresh(new Date());
    toast({
      title: "Dashboard Refreshed",
      description: "System metrics have been updated."
    });
  };

  if (loading && !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <PageContainer>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Error Loading Data
            </CardTitle>
            <CardDescription>
              Unable to load system metrics. Please try refreshing the page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleManualRefresh} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              System-wide analytics and agency management
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-xs">
              System Admin
            </Badge>
            <div className="text-sm text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <Button 
              onClick={handleManualRefresh} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/super-admin/agencies')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Manage Agencies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                View and manage all agencies
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/super-admin/system-settings')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Configure system-wide settings
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/super-admin/plans')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Manage subscription plans
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate('/super-admin/page-catalog')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Page Catalog
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Manage available pages
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Status Alert */}
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <div className="font-medium text-green-800 dark:text-green-200">All Systems Operational</div>
                <div className="text-sm text-green-600 dark:text-green-300">
                  Platform is running smoothly with {metrics.systemHealth.uptime} uptime
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <SystemMetricsCards metrics={metrics} />

        {/* Analytics Charts */}
        <SystemDashboardCharts metrics={metrics} />

        {/* Monitoring Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RealTimeUsageWidget />
          <SupportTicketsWidget />
        </div>
      </div>
    </PageContainer>
  );
};

export default SuperAdminDashboard;

