import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface AgencyMetrics {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  activeProjects: number;
  totalClients: number;
  totalInvoices: number;
  totalRevenue: number;
  monthlyRevenue: number;
  attendanceRecords: number;
  leaveRequests: {
    pending: number;
    approved: number;
    total: number;
  };
  recentActivity: {
    newUsers: number;
    newProjects: number;
    newInvoices: number;
  };
}

export const useAgencyAnalytics = () => {
  const { userRole } = useAuth();
  const [metrics, setMetrics] = useState<AgencyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAgencyMetrics = async () => {
    try {
      setLoading(true);

      // Only allow agency-level roles to access this data
      if (userRole === 'super_admin') {
        throw new Error('Super admin should use system analytics');
      }

      // Get current user's agency ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.agency_id) {
        throw new Error('No agency associated with user');
      }

      const agencyId = profile.agency_id;

      // Fetch agency-specific metrics
      const [
        usersResult,
        activeUsersResult,
        projectsResult,
        activeProjectsResult,
        clientsResult,
        invoicesResult,
        attendanceResult,
        leaveRequestsResult,
        recentUsersResult,
        recentProjectsResult,
        recentInvoicesResult
      ] = await Promise.all([
        // Total users in agency
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId),
        // Active users in agency
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId).eq('is_active', true),
        // Total projects in agency
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId),
        // Active projects in agency
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId).eq('status', 'active'),
        // Total clients in agency
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId),
        // Total invoices and revenue in agency
        supabase.from('invoices').select('total_amount').eq('agency_id', agencyId),
        // Attendance records in agency
        supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId),
        // Leave requests in agency
        supabase.from('leave_requests').select('status').eq('agency_id', agencyId),
        // Recent users (last 30 days)
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .eq('agency_id', agencyId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        // Recent projects (last 30 days)
        supabase.from('projects').select('*', { count: 'exact', head: true })
          .eq('agency_id', agencyId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        // Recent invoices (last 30 days)
        supabase.from('invoices').select('total_amount')
          .eq('agency_id', agencyId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      // Calculate revenue metrics
      const totalRevenue = invoicesResult.data?.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0) || 0;
      const monthlyRevenue = recentInvoicesResult.data?.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0) || 0;

      // Process leave requests
      const leaveRequestsData = leaveRequestsResult.data || [];
      const leaveRequests = {
        pending: leaveRequestsData.filter(lr => lr.status === 'pending').length,
        approved: leaveRequestsData.filter(lr => lr.status === 'approved').length,
        total: leaveRequestsData.length
      };

      const agencyMetrics: AgencyMetrics = {
        totalUsers: usersResult.count || 0,
        activeUsers: activeUsersResult.count || 0,
        totalProjects: projectsResult.count || 0,
        activeProjects: activeProjectsResult.count || 0,
        totalClients: clientsResult.count || 0,
        totalInvoices: invoicesResult.data?.length || 0,
        totalRevenue,
        monthlyRevenue,
        attendanceRecords: attendanceResult.count || 0,
        leaveRequests,
        recentActivity: {
          newUsers: recentUsersResult.count || 0,
          newProjects: recentProjectsResult.count || 0,
          newInvoices: recentInvoicesResult.data?.length || 0,
        }
      };

      setMetrics(agencyMetrics);

    } catch (error: any) {
      console.error('Error fetching agency metrics:', error);
      toast({
        title: "Error loading agency metrics",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole && userRole !== 'super_admin') {
      fetchAgencyMetrics();
    } else if (userRole === 'super_admin') {
      setLoading(false);
    }
  }, [userRole]);

  const refreshMetrics = () => {
    fetchAgencyMetrics();
  };

  return {
    metrics,
    loading,
    refreshMetrics,
  };
};