import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { 
  LogOut, User, Building, Users, Calculator, DollarSign, Calendar, Clock, 
  TrendingUp, AlertCircle, CalendarDays, Shield, ChevronRight, Bell,
  Briefcase, FileText, Settings, BookOpen
} from 'lucide-react';
import ClockInOut from '@/components/ClockInOut';
import { AgencyCalendar } from '@/components/AgencyCalendar';
import { QuickActionsPanel } from '@/components/QuickActionsPanel';
import { PageContainer, StatsGrid, ContentGrid } from '@/components/layout';
import { db } from '@/lib/database';

const Index = () => {
  const { user, profile, userRole, signOut } = useAuth();
  const [dashboardStats, setDashboardStats] = useState({
    activeProjects: 0,
    teamMembers: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    pendingLeaveRequests: 0,
    pendingReimbursements: 0
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real dashboard data from database
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch projects count
        const { data: projects } = await db
          .from('projects')
          .select('*')
          .eq('status', 'in_progress');

        // Fetch team members count
        const { data: members } = await db
          .from('profiles')
          .select('*')
          .eq('is_active', true);

        // Fetch invoices for revenue calculation
        const { data: invoices } = await db
          .from('invoices')
          .select('*')
          .eq('status', 'paid');

        // Fetch pending payments
        const { data: pendingInvoices } = await db
          .from('invoices')
          .select('*')
          .eq('status', 'sent');

        // Fetch pending leave requests (for HR/Admin)
        const { data: leaveRequests } = await db
          .from('leave_requests')
          .select('*')
          .eq('status', 'pending');

        // Fetch pending reimbursements (for Finance/Admin)
        const { data: reimbursements } = await db
          .from('reimbursement_requests')
          .select('*')
          .eq('status', 'pending');

        // Fetch recent projects
        const { data: recentProjectsData } = await db
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(4);

        // Calculate totals
        const totalRevenue = (invoices || []).reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        const totalPending = (pendingInvoices || []).reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

        setDashboardStats({
          activeProjects: (projects || []).length,
          teamMembers: (members || []).length,
          monthlyRevenue: totalRevenue,
          pendingPayments: (pendingInvoices || []).length,
          pendingLeaveRequests: (leaveRequests || []).length,
          pendingReimbursements: (reimbursements || []).length
        });

        setRecentProjects(recentProjectsData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <Shield className="h-5 w-5 text-purple-500" />;
      case 'admin': return <Building className="h-5 w-5 text-blue-500" />;
      case 'hr': return <Users className="h-5 w-5 text-green-500" />;
      case 'finance_manager': return <Calculator className="h-5 w-5 text-yellow-500" />;
      case 'employee': return <User className="h-5 w-5 text-gray-500" />;
      default: return <User className="h-5 w-5" />;
    }
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'super_admin': 'Super Administrator',
      'admin': 'Administrator',
      'hr': 'HR Manager',
      'finance_manager': 'Finance Manager',
      'employee': 'Employee',
      'project_manager': 'Project Manager',
      'sales_manager': 'Sales Manager',
      'ceo': 'CEO',
      'cto': 'CTO',
      'cfo': 'CFO'
    };
    return roleMap[role] || 'Employee';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'hr': return 'bg-green-100 text-green-800 border-green-200';
      case 'finance_manager': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDashboardMessage = (role: string) => {
    const messages: Record<string, string> = {
      'super_admin': "Full system access. Manage all aspects of the platform including users, agencies, and system settings.",
      'admin': "Administrative access to user management, projects, finance, and HR operations.",
      'hr': "Manage employee profiles, attendance, payroll processing, and HR operations.",
      'finance_manager': "Handle financial operations including payments, invoices, receipts, and financial reporting.",
      'employee': "View your projects, mark attendance, submit leave requests, and view your payroll information.",
      'project_manager': "Manage projects, tasks, timelines, and team resources effectively."
    };
    return messages[role] || "Welcome to the BuildFlow Management System.";
  };

  // Mock data for charts (these would come from database aggregations in production)
  const monthlyRevenueData = [
    { month: 'Jan', revenue: 42000, expenses: 28000 },
    { month: 'Feb', revenue: 38000, expenses: 25000 },
    { month: 'Mar', revenue: 45000, expenses: 30000 },
    { month: 'Apr', revenue: 52000, expenses: 32000 },
    { month: 'May', revenue: 48000, expenses: 29000 },
    { month: 'Jun', revenue: 55000, expenses: 35000 },
  ];

  const projectStatusData = [
    { name: 'Completed', value: 35, color: '#22c55e' },
    { name: 'In Progress', value: 25, color: '#3b82f6' },
    { name: 'Planning', value: 15, color: '#f59e0b' },
    { name: 'On Hold', value: 8, color: '#ef4444' },
  ];

  const attendanceData = [
    { day: 'Mon', present: 45, absent: 3 },
    { day: 'Tue', present: 47, absent: 1 },
    { day: 'Wed', present: 46, absent: 2 },
    { day: 'Thu', present: 48, absent: 0 },
    { day: 'Fri', present: 44, absent: 4 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'planning': return 'bg-yellow-500';
      case 'on_hold': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <PageContainer>
      {/* User Welcome Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border rounded-xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* User Info */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">
                  Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}!
                </h2>
                {getRoleIcon(userRole || 'employee')}
              </div>
              <p className="text-muted-foreground max-w-xl">
                {getDashboardMessage(userRole || 'employee')}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={getRoleBadgeColor(userRole || 'employee')}>
                  {getRoleDisplay(userRole || 'employee')}
                </Badge>
                {profile?.department && (
                  <Badge variant="secondary">{profile.department}</Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/my-profile">
                <User className="h-4 w-4 mr-2" />
                My Profile
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {dashboardStats.pendingLeaveRequests > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
                    {dashboardStats.pendingLeaveRequests}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Time Clock Section - Show for all users */}
      <div className="mb-6">
        <ClockInOut compact={true} />
      </div>

      {/* Quick Actions for Admin and HR */}
      {(userRole === 'admin' || userRole === 'hr' || userRole === 'super_admin') && (
        <div className="mb-6">
          <QuickActionsPanel />
        </div>
      )}

      {/* Quick Stats Cards */}
      <StatsGrid cols={4}>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Building className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{dashboardStats.activeProjects}</div>
                <p className="text-xs text-muted-foreground">Currently in progress</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{dashboardStats.teamMembers}</div>
                <p className="text-xs text-muted-foreground">Active employees</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(dashboardStats.monthlyRevenue)}</div>
                <p className="text-xs text-muted-foreground">From paid invoices</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <Calculator className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{dashboardStats.pendingPayments}</div>
                <p className="text-xs text-muted-foreground">Awaiting payment</p>
              </>
            )}
          </CardContent>
        </Card>
      </StatsGrid>

      {/* Charts and Analytics Section with Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Calendar Widget */}
        <div className="lg:col-span-1">
          <AgencyCalendar compact />
        </div>
        
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monthly Revenue vs Expenses */}
          {(userRole === 'admin' || userRole === 'finance_manager' || userRole === 'super_admin') && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base lg:text-lg">Revenue vs Expenses</CardTitle>
                <CardDescription className="text-sm">Financial performance over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent className="px-2 lg:px-6">
                <div className="w-full overflow-x-auto">
                  <ResponsiveContainer width="100%" height={250} minWidth={300}>
                    <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} interval={0} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `₹${(value/1000)}k`} />
                      <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']} contentStyle={{ fontSize: '12px' }} />
                      <Area type="monotone" dataKey="revenue" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} name="Revenue" />
                      <Area type="monotone" dataKey="expenses" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Expenses" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weekly Attendance */}
          {(userRole === 'admin' || userRole === 'hr' || userRole === 'super_admin') && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base lg:text-lg">Weekly Attendance</CardTitle>
                <CardDescription className="text-sm">Employee attendance for this week</CardDescription>
              </CardHeader>
              <CardContent className="px-2 lg:px-6">
                <div className="w-full overflow-x-auto">
                  <ResponsiveContainer width="100%" height={220} minWidth={250}>
                    <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="present" fill="#22c55e" name="Present" />
                      <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Status Overview */}
          {(userRole === 'admin' || userRole === 'super_admin') && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base lg:text-lg">Project Status Overview</CardTitle>
                <CardDescription className="text-sm">Distribution of projects by status</CardDescription>
              </CardHeader>
              <CardContent className="px-2 lg:px-6">
                <div className="flex flex-col lg:flex-row items-center gap-4">
                  <div className="w-full lg:w-1/2">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={projectStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {projectStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full lg:w-1/2 grid grid-cols-2 gap-2">
                    {projectStatusData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                        <div className="min-w-0">
                          <div className="font-medium truncate">{entry.name}</div>
                          <div className="text-muted-foreground">{entry.value} projects</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Projects */}
      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Recent Projects
              </CardTitle>
              <CardDescription>Latest project updates</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/projects">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No projects found</p>
                <Button variant="link" asChild className="mt-2">
                  <Link to="/projects">Create your first project</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{project.name}</h3>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                          <span className="text-xs text-muted-foreground capitalize">{project.status?.replace('_', ' ')}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {project.clients?.name || 'No client assigned'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'No start date'}
                          </span>
                          {project.budget && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(project.budget)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">{project.progress || 0}%</div>
                        <Progress value={project.progress || 0} className="w-20 h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role-specific Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Project milestone completed</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New team member onboarded</p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Invoice payment received</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Navigation</CardTitle>
            <CardDescription>Common tasks for your role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {userRole === 'admin' || userRole === 'super_admin' ? (
                <>
                  <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                    <Link to="/users">
                      <Users className="h-6 w-6" />
                      <span className="text-sm">Manage Users</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                    <Link to="/projects">
                      <Building className="h-6 w-6" />
                      <span className="text-sm">View Projects</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                    <Link to="/clients">
                      <Briefcase className="h-6 w-6" />
                      <span className="text-sm">Manage Clients</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                    <Link to="/reports">
                      <FileText className="h-6 w-6" />
                      <span className="text-sm">View Reports</span>
                    </Link>
                  </Button>
                </>
              ) : userRole === 'hr' ? (
                <>
                  <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                    <Link to="/employees">
                      <Users className="h-6 w-6" />
                      <span className="text-sm">Employees</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                    <Link to="/payroll">
                      <Calculator className="h-6 w-6" />
                      <span className="text-sm">Payroll</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                    <Link to="/attendance">
                      <Clock className="h-6 w-6" />
                      <span className="text-sm">Attendance</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                    <Link to="/leave-requests">
                      <CalendarDays className="h-6 w-6" />
                      <span className="text-sm">Leave Requests</span>
                    </Link>
                  </Button>
                </>
              ) : userRole === 'finance_manager' ? (
                <>
                  <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                    <Link to="/financial-management">
                      <BookOpen className="h-6 w-6" />
                      <span className="text-sm">Financial Management</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                    <Link to="/invoices">
                      <DollarSign className="h-6 w-6" />
                      <span className="text-sm">Invoices</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                    <Link to="/ledger">
                      <Calculator className="h-6 w-6" />
                      <span className="text-sm">Ledger</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                    <Link to="/payments">
                      <TrendingUp className="h-6 w-6" />
                      <span className="text-sm">Payments</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                    <Link to="/reports">
                      <FileText className="h-6 w-6" />
                      <span className="text-sm">Reports</span>
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                    <Link to="/my-profile">
                      <User className="h-6 w-6" />
                      <span className="text-sm">My Profile</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                    <Link to="/my-attendance">
                      <Clock className="h-6 w-6" />
                      <span className="text-sm">My Attendance</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                    <Link to="/my-leave">
                      <CalendarDays className="h-6 w-6" />
                      <span className="text-sm">My Leave</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                    <Link to="/settings">
                      <Settings className="h-6 w-6" />
                      <span className="text-sm">Settings</span>
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Index;
