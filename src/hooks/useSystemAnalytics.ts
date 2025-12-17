import { useState, useEffect } from 'react';
import { queryMainDatabase } from '@/integrations/postgresql/client-http';
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

      // Fetch agencies data from main database
      const agenciesResult = await queryMainDatabase<any>(
        `SELECT * FROM public.agencies ORDER BY created_at DESC`,
        [],
        userId
      );
      const agenciesData = agenciesResult.rows || [];

      // Fetch total users from main database
      const usersResult = await queryMainDatabase<any>(
        `SELECT * FROM public.profiles`,
        [],
        userId
      );
      const totalUsers = usersResult.rows?.length || 0;

      // Fetch active users from main database
      const activeUsersResult = await queryMainDatabase<any>(
        `SELECT * FROM public.profiles WHERE is_active = true`,
        [],
        userId
      );
      const activeUsers = activeUsersResult.rows?.length || 0;

      // Fetch subscription plan distribution from main database
      const planDistributionResult = await queryMainDatabase<{ subscription_plan: string }>(
        `SELECT subscription_plan FROM public.agencies WHERE is_active = true`,
        [],
        userId
      );
      const planDistribution = planDistributionResult.rows || [];

      // Fetch usage statistics from main database
      // Note: These tables may be in agency databases, but for system-level stats,
      // we query the main database. If tables don't exist, we'll handle gracefully.
      const [projectsResult, invoicesResult, clientsResult, attendanceResult] = await Promise.all([
        queryMainDatabase<any>(`SELECT * FROM public.projects`, [], userId).catch(() => ({ rows: [] })),
        queryMainDatabase<any>(`SELECT * FROM public.invoices`, [], userId).catch(() => ({ rows: [] })),
        queryMainDatabase<any>(`SELECT * FROM public.clients`, [], userId).catch(() => ({ rows: [] })),
        queryMainDatabase<any>(`SELECT * FROM public.attendance`, [], userId).catch(() => ({ rows: [] }))
      ]);

      // Process subscription plans
      const subscriptionPlans = {
        basic: planDistribution.filter(p => p.subscription_plan === 'basic').length || 0,
        pro: planDistribution.filter(p => p.subscription_plan === 'pro').length || 0,
        enterprise: planDistribution.filter(p => p.subscription_plan === 'enterprise').length || 0,
      };

      // Calculate basic MRR/ARR (simplified pricing)
      const priceMap = { basic: 29, pro: 79, enterprise: 199 };
      const mrr = subscriptionPlans.basic * priceMap.basic + 
                  subscriptionPlans.pro * priceMap.pro + 
                  subscriptionPlans.enterprise * priceMap.enterprise;

      // Fetch detailed agency data with user counts from main database
      const agenciesWithStats = await Promise.all(
        agenciesData.map(async (agency) => {
          // Query user count from main database
          const userResult = await queryMainDatabase<any>(
            `SELECT * FROM public.profiles WHERE agency_id = $1`,
            [agency.id],
            userId
          ).catch(() => ({ rows: [] }));
          const userCount = userResult.rows?.length || 0;

          // Query project count from main database (if table exists)
          // If projects are in agency databases, this will return 0
          const projectResult = await queryMainDatabase<any>(
            `SELECT * FROM public.projects WHERE agency_id = $1`,
            [agency.id],
            userId
          ).catch(() => ({ rows: [] }));
          const projectCount = projectResult.rows?.length || 0;

          // Query invoice count from main database (if table exists)
          // If invoices are in agency databases, this will return 0
          const invoiceResult = await queryMainDatabase<any>(
            `SELECT * FROM public.invoices WHERE agency_id = $1`,
            [agency.id],
            userId
          ).catch(() => ({ rows: [] }));
          const invoiceCount = invoiceResult.rows?.length || 0;

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
          totalProjects: projectsResult.rows?.length || 0,
          totalInvoices: invoicesResult.rows?.length || 0,
          totalClients: clientsResult.rows?.length || 0,
          totalAttendanceRecords: attendanceResult.rows?.length || 0,
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