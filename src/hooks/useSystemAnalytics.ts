import { useState, useEffect } from 'react';
import { db } from '@/lib/database';
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
      const { data: agenciesData, error: agenciesError } = await db
        .from('agencies')
        .select('*')
        .order('created_at', { ascending: false });

      if (agenciesError) throw agenciesError;

      // Fetch total users
      const usersData = await db
        .from('profiles')
        .select('*');
      const totalUsers = usersData.data?.length || 0;

      // Fetch active users
      const activeUsersData = await db
        .from('profiles')
        .select('*')
        .eq('is_active', true);
      const activeUsers = activeUsersData.data?.length || 0;

      // Fetch subscription plan distribution
      const { data: planDistribution, error: planError } = await db
        .from('agencies')
        .select('subscription_plan')
        .eq('is_active', true);

      if (planError) throw planError;

      // Fetch usage statistics
      const [projectsResult, invoicesResult, clientsResult, attendanceResult] = await Promise.all([
        db.from('projects').select('*'),
        db.from('invoices').select('*'),
        db.from('clients').select('*'),
        db.from('attendance').select('*')
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
          const userData = await db
            .from('profiles')
            .select('*')
            .eq('agency_id', agency.id);
          const userCount = userData.data?.length || 0;

          const projectData = await db
            .from('projects')
            .select('*')
            .eq('agency_id', agency.id);
          const projectCount = projectData.data?.length || 0;

          const invoiceData = await db
            .from('invoices')
            .select('*')
            .eq('agency_id', agency.id);
          const invoiceCount = invoiceData.data?.length || 0;

          return {
            ...agency,
            user_count: userCount,
            project_count: projectCount,
            invoice_count: invoiceCount,
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
          totalProjects: projectsResult.data?.length || 0,
          totalInvoices: invoicesResult.data?.length || 0,
          totalClients: clientsResult.data?.length || 0,
          totalAttendanceRecords: attendanceResult.data?.length || 0,
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