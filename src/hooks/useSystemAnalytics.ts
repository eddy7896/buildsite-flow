import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SystemMetrics {
  totalAgencies: number;
  activeAgencies: number;
  totalUsers: number;
  activeUsers: number;
  subscriptionPlans: {
    basic: number;
    pro: number;
    enterprise: number;
  };
  revenueMetrics: {
    mrr: number;
    arr: number;
  };
  usageStats: {
    totalProjects: number;
    totalInvoices: number;
    totalClients: number;
    totalAttendanceRecords: number;
  };
  systemHealth: {
    uptime: string;
    responseTime: number;
    errorRate: number;
  };
}

export interface AgencyData {
  id: string;
  name: string;
  domain: string;
  subscription_plan: string;
  max_users: number;
  is_active: boolean;
  created_at: string;
  user_count: number;
  project_count: number;
  invoice_count: number;
}

interface UseSystemAnalyticsProps {
  userId: string;
  userRole: string;
}

export const useSystemAnalytics = ({ userId, userRole }: UseSystemAnalyticsProps) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [agencies, setAgencies] = useState<AgencyData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSystemMetrics = async () => {
    try {
      setLoading(true);

      // Check if user has super_admin role (passed from component)
      if (userRole !== 'super_admin') {
        throw new Error('Access denied: Super admin role required');
      }

      // Fetch agencies data
      const { data: agenciesData, error: agenciesError } = await supabase
        .from('agencies')
        .select('*')
        .order('created_at', { ascending: false });

      if (agenciesError) throw agenciesError;

      // Fetch total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Fetch active users
      const { count: activeUsers, error: activeUsersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (activeUsersError) throw activeUsersError;

      // Fetch subscription plan distribution
      const { data: planDistribution, error: planError } = await supabase
        .from('agencies')
        .select('subscription_plan')
        .eq('is_active', true);

      if (planError) throw planError;

      // Fetch usage statistics
      const [projectsResult, invoicesResult, clientsResult, attendanceResult] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('invoices').select('*', { count: 'exact', head: true }),
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('attendance').select('*', { count: 'exact', head: true })
      ]);

      // Process subscription plans
      const subscriptionPlans = {
        basic: planDistribution?.filter(p => p.subscription_plan === 'basic').length || 0,
        pro: planDistribution?.filter(p => p.subscription_plan === 'pro').length || 0,
        enterprise: planDistribution?.filter(p => p.subscription_plan === 'enterprise').length || 0,
      };

      // Calculate basic MRR/ARR (simplified pricing)
      const priceMap = { basic: 29, pro: 79, enterprise: 199 };
      const mrr = subscriptionPlans.basic * priceMap.basic + 
                  subscriptionPlans.pro * priceMap.pro + 
                  subscriptionPlans.enterprise * priceMap.enterprise;

      // Fetch detailed agency data with user counts
      const agenciesWithStats = await Promise.all(
        (agenciesData || []).map(async (agency) => {
          const { count: userCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('agency_id', agency.id);

          const { count: projectCount } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('agency_id', agency.id);

          const { count: invoiceCount } = await supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true })
            .eq('agency_id', agency.id);

          return {
            ...agency,
            user_count: userCount || 0,
            project_count: projectCount || 0,
            invoice_count: invoiceCount || 0,
          };
        })
      );

      const systemMetrics: SystemMetrics = {
        totalAgencies: agenciesData?.length || 0,
        activeAgencies: agenciesData?.filter(a => a.is_active).length || 0,
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        subscriptionPlans,
        revenueMetrics: {
          mrr,
          arr: mrr * 12,
        },
        usageStats: {
          totalProjects: projectsResult.count || 0,
          totalInvoices: invoicesResult.count || 0,
          totalClients: clientsResult.count || 0,
          totalAttendanceRecords: attendanceResult.count || 0,
        },
        systemHealth: {
          uptime: '99.9%',
          responseTime: Math.random() * 100 + 50, // Simulated
          errorRate: Math.random() * 2, // Simulated
        },
      };

      setMetrics(systemMetrics);
      setAgencies(agenciesWithStats);

    } catch (error: any) {
      console.error('Error fetching system metrics:', error);
      toast({
        title: "Error loading system metrics",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && userRole) {
      fetchSystemMetrics();
    }
  }, [userId, userRole]);

  const refreshMetrics = () => {
    fetchSystemMetrics();
  };

  return {
    metrics,
    agencies,
    loading,
    refreshMetrics,
  };
};