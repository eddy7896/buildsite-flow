import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAgencyAnalytics, AgencyMetrics } from '@/hooks/useAgencyAnalytics';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';
import { GridPattern, GlowOrb } from '@/components/landing/fragments';
import {
  Users,
  Building,
  DollarSign,
  FileText,
  TrendingUp,
  Calendar,
  CalendarDays,
  Settings,
  BarChart3,
  Briefcase,
  CreditCard,
  UserPlus,
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Activity,
  Zap,
  Target,
  PieChart,
  Mail,
  Bell,
  Shield,
  Database,
  Workflow,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color = 'blue',
  onClick 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: any; 
  trend?: string;
  color?: 'blue' | 'emerald' | 'purple' | 'orange' | 'cyan';
  onClick?: () => void;
}) => {
  const colorMap = {
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'text-blue-400', glow: 'shadow-blue-500/5' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400', glow: 'shadow-emerald-500/5' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: 'text-purple-400', glow: 'shadow-purple-500/5' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: 'text-orange-400', glow: 'shadow-orange-500/5' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: 'text-cyan-400', glow: 'shadow-cyan-500/5' },
  };

  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "group relative rounded-xl border bg-card p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-lg",
        onClick && "cursor-pointer",
        colors.glow
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2 rounded-lg", colors.bg)}>
          <Icon className={cn("w-4 h-4", colors.icon)} />
        </div>
        {trend && (
          <Badge variant="outline" className="text-xs border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            {trend}
          </Badge>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-semibold text-foreground font-display tracking-tight">{value}</div>
        <div className="text-xs text-muted-foreground">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground/70 mt-1">{subtitle}</div>}
      </div>
      {onClick && (
        <ArrowRight className="absolute bottom-4 right-4 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      )}
    </motion.div>
  );
};

const QuickActionCard = ({
  title,
  description,
  icon: Icon,
  href,
  color = 'blue',
  badge,
}: {
  title: string;
  description: string;
  icon: any;
  href: string;
  color?: 'blue' | 'emerald' | 'purple' | 'orange' | 'cyan';
  badge?: string;
}) => {
  const navigate = useNavigate();
  const colorMap = {
    blue: { bg: 'bg-blue-500/10', border: 'group-hover:border-blue-500/30', icon: 'text-blue-400', glow: 'group-hover:shadow-blue-500/5' },
    emerald: { bg: 'bg-emerald-500/10', border: 'group-hover:border-emerald-500/30', icon: 'text-emerald-400', glow: 'group-hover:shadow-emerald-500/5' },
    purple: { bg: 'bg-purple-500/10', border: 'group-hover:border-purple-500/30', icon: 'text-purple-400', glow: 'group-hover:shadow-purple-500/5' },
    orange: { bg: 'bg-orange-500/10', border: 'group-hover:border-orange-500/30', icon: 'text-orange-400', glow: 'group-hover:shadow-orange-500/5' },
    cyan: { bg: 'bg-cyan-500/10', border: 'group-hover:border-cyan-500/30', icon: 'text-cyan-400', glow: 'group-hover:shadow-cyan-500/5' },
  };

  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={() => navigate(href)}
      className={cn(
        "group relative rounded-xl border bg-card p-5 transition-all duration-500 cursor-pointer",
        colors.border,
        colors.glow,
        "hover:shadow-lg hover:scale-[1.01]"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
          <div className="relative z-10">
            <div className="flex items-start gap-3 mb-3">
              <div className={cn("p-2.5 rounded-xl", colors.bg)}>
                <Icon className={cn("w-5 h-5", colors.icon)} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground font-display tracking-tight">{title}</h3>
                  {badge && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
    </motion.div>
  );
};

const AgencyAdminDashboard = () => {
  const { user, userRole, profile } = useAuth();
  const { metrics, loading, refreshMetrics } = useAgencyAnalytics();
  const { toast } = useToast();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Redirect super_admin users to super admin dashboard
  if (userRole === 'super_admin') {
    return <Navigate to="/super-admin" replace />;
  }

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
      description: "Agency metrics have been updated.",
    });
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <h3 className="text-lg font-semibold mb-1">Error Loading Data</h3>
                <p className="text-sm text-muted-foreground">
                  Unable to load agency metrics. Please try refreshing the page.
                </p>
              </div>
              <Button onClick={handleManualRefresh} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Manage Team',
      description: 'Add, edit, and manage team members',
      icon: Users,
      href: '/employees',
      color: 'blue' as const,
    },
    {
      title: 'Projects',
      description: 'Track and manage all projects',
      icon: FolderKanban,
      href: '/projects',
      color: 'purple' as const,
    },
    {
      title: 'Financial Management',
      description: 'Invoices, expenses, and revenue',
      icon: DollarSign,
      href: '/financial-management',
      color: 'emerald' as const,
    },
    {
      title: 'CRM & Clients',
      description: 'Manage client relationships',
      icon: Briefcase,
      href: '/crm',
      color: 'orange' as const,
    },
    {
      title: 'Analytics & Reports',
      description: 'View detailed analytics and insights',
      icon: BarChart3,
      href: '/analytics',
      color: 'cyan' as const,
    },
    {
      title: 'Settings',
      description: 'Configure agency settings',
      icon: Settings,
      href: '/settings',
      color: 'blue' as const,
    },
    {
      title: 'Calendar & Events',
      description: 'Manage events and holidays',
      icon: Calendar,
      href: '/calendar',
      color: 'purple' as const,
    },
    {
      title: 'Workflows',
      description: 'Automate your agency processes',
      icon: Workflow,
      href: '/workflows',
      color: 'emerald' as const,
    },
  ];

  return (
    <div className="relative w-full min-h-full bg-background antialiased overflow-hidden">
      {/* Background Effects - Subtle for dashboard - Contained within content */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="relative w-full h-full">
          <GridPattern />
          <GlowOrb color="blue" size={300} className="top-[10%] right-[5%] opacity-15" blur={60} />
          <GlowOrb color="emerald" size={250} className="bottom-[10%] right-[5%] opacity-15" blur={60} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.15)_100%)]" />
        </div>
      </div>
      
      <div className="relative z-10 w-full space-y-6">
        {/* Header Section */}
        <section className="relative w-full">
          <div className="w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-foreground leading-[1.1] tracking-[-0.02em]"
                >
                  Welcome back, {profile?.first_name || user?.email?.split('@')[0] || 'Admin'}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="mt-2 text-sm sm:text-base text-muted-foreground"
                >
                  Here's what's happening with your agency today
                </motion.p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground hidden sm:block">
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

            {/* Key Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Total Users"
                value={metrics.totalUsers}
                subtitle={`${metrics.activeUsers} active`}
                icon={Users}
                color="blue"
                onClick={() => window.location.href = '/employees'}
              />
              <StatCard
                title="Projects"
                value={metrics.totalProjects}
                subtitle={`${metrics.activeProjects} active`}
                icon={Building}
                color="purple"
                onClick={() => window.location.href = '/projects'}
              />
              <StatCard
                title="Total Revenue"
                value={`$${metrics.totalRevenue.toLocaleString()}`}
                subtitle={`$${metrics.monthlyRevenue.toLocaleString()} this month`}
                icon={DollarSign}
                color="emerald"
                trend="+24.5%"
                onClick={() => window.location.href = '/financial-management'}
              />
              <StatCard
                title="Invoices"
                value={metrics.totalInvoices}
                subtitle={`${metrics.totalClients} clients`}
                icon={FileText}
                color="orange"
                onClick={() => window.location.href = '/financial-management'}
              />
            </div>
          </div>
        </section>

        {/* Quick Actions Bento Grid */}
        <section className="relative w-full">
          <div className="w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-6"
            >
              <h2 className="text-2xl font-semibold text-foreground font-display tracking-tight mb-2">
                Quick Actions
              </h2>
              <p className="text-sm text-muted-foreground">
                Access all your agency management tools
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <QuickActionCard
                  key={action.href}
                  {...action}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Recent Activity & Status */}
        <section className="relative w-full">
          <div className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="lg:col-span-2 rounded-xl border bg-card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground font-display">Recent Activity (30 days)</h3>
                  <Activity className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <UserPlus className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">New Users</div>
                        <div className="text-xs text-muted-foreground">Added to your agency</div>
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-foreground">{metrics.recentActivity.newUsers}</div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <FolderKanban className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">New Projects</div>
                        <div className="text-xs text-muted-foreground">Created this month</div>
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-foreground">{metrics.recentActivity.newProjects}</div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <FileText className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">New Invoices</div>
                        <div className="text-xs text-muted-foreground">Generated this month</div>
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-foreground">{metrics.recentActivity.newInvoices}</div>
                  </div>
                </div>
              </motion.div>

              {/* Agency Status & Quick Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-4"
              >
                {/* Agency Status */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-emerald-400">Agency Active</div>
                      <div className="text-xs text-emerald-400/80">All systems operational</div>
                    </div>
                  </div>
                </div>

                {/* Leave Requests */}
                <div className="rounded-xl border bg-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Leave Requests</h3>
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Pending</span>
                      <Badge variant="outline" className="border-yellow-500/20 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                        {metrics.leaveRequests.pending}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Approved</span>
                      <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {metrics.leaveRequests.approved}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">Total</span>
                      <span className="text-sm font-medium text-foreground">{metrics.leaveRequests.total}</span>
                    </div>
                  </div>
                </div>

                {/* Attendance */}
                <div className="rounded-xl border bg-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Attendance</h3>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-semibold text-foreground font-display mb-1">
                    {metrics.attendanceRecords}
                  </div>
                  <div className="text-xs text-muted-foreground">Total records</div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AgencyAdminDashboard;

