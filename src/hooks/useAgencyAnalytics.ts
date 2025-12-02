import { useState, useEffect } from 'react';
import { db } from '@/lib/database';
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
  const { userRole, user, profile: authProfile } = useAuth();
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

      // Get agency ID from auth profile or fetch it
      let agencyId = authProfile?.agency_id;
      
      if (!agencyId && user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('agency_id')
          .eq('user_id', user.id)
          .single();
        agencyId = profile?.agency_id;
      }

      if (!agencyId) {
        // Use default agency for development
        agencyId = '550e8400-e29b-41d4-a716-446655440000';
      }

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
        db.from('profiles').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId),
        // Active users in agency
        db.from('profiles').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId).eq('is_active', true),
        // Total projects in agency
        db.from('projects').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId),
        // Active projects in agency
        db.from('projects').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId).eq('status', 'active'),
        // Total clients in agency
        db.from('clients').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId),
        // Total invoices and revenue in agency
        db.from('invoices').select('total_amount').eq('agency_id', agencyId),
        // Attendance records in agency
        db.from('attendance').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId),
        // Leave requests in agency
        db.from('leave_requests').select('status').eq('agency_id', agencyId),
        // Recent users (last 30 days)
        db.from('profiles').select('*', { count: 'exact', head: true })
          .eq('agency_id', agencyId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        // Recent projects (last 30 days)
        db.from('projects').select('*', { count: 'exact', head: true })
          .eq('agency_id', agencyId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        // Recent invoices (last 30 days)
        db.from('invoices').select('total_amount')
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