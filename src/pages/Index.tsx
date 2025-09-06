import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { LogOut, User, Building, Users, Calculator, DollarSign, Calendar, Clock, TrendingUp, AlertCircle, CalendarDays } from 'lucide-react';
import ClockInOut from '@/components/ClockInOut';
import { AgencyCalendar } from '@/components/AgencyCalendar';

const Index = () => {
  const { user, profile, userRole, signOut } = useAuth();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Building className="h-5 w-5" />;
      case 'hr': return <Users className="h-5 w-5" />;
      case 'finance_manager': return <Calculator className="h-5 w-5" />;
      case 'employee': return <User className="h-5 w-5" />;
      default: return <User className="h-5 w-5" />;
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'hr': return 'HR Manager';
      case 'finance_manager': return 'Finance Manager';
      case 'employee': return 'Employee';
      default: return 'Employee';
    }
  };

  const getDashboardMessage = (role: string) => {
    switch (role) {
      case 'admin': 
        return "You have full access to all system features including user management, projects, finance, and HR operations.";
      case 'hr': 
        return "Manage employee profiles, attendance, payroll processing, and HR operations.";
      case 'finance_manager': 
        return "Handle financial operations including payments, invoices, receipts, and financial reporting.";
      case 'employee': 
        return "View your projects, mark attendance, submit leave requests, and view your payroll information.";
      default: 
        return "Welcome to the Construction ERP system.";
    }
  };

  // Mock data for charts
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

  // Mock project data
  const assignedProjects = [
    {
      id: 1,
      name: "Website Redesign",
      client: "ABC Corporation",
      progress: 75,
      status: "in-progress",
      deadline: "2024-03-15",
      priority: "high",
      team: ["John", "Sarah", "Mike"]
    },
    {
      id: 2,
      name: "Mobile App Development",
      client: "XYZ Ltd",
      progress: 45,
      status: "in-progress",
      deadline: "2024-04-30",
      priority: "medium",
      team: ["Emily", "David", "Lisa"]
    },
    {
      id: 3,
      name: "CRM Integration",
      client: "Tech Solutions",
      progress: 100,
      status: "completed",
      deadline: "2024-01-20",
      priority: "low",
      team: ["Alex", "Maria"]
    },
    {
      id: 4,
      name: "E-commerce Platform",
      client: "Digital Media",
      progress: 20,
      status: "planning",
      deadline: "2024-06-15",
      priority: "high",
      team: ["Robert", "Jennifer", "Tom", "Nina"]
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'planning': return 'bg-yellow-500';
      case 'on-hold': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="bg-background">
      {/* Header */}
      <div className="border-b bg-card px-4 lg:px-6 py-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name || 'User'}</p>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
            <div className="text-left lg:text-right">
              <p className="font-medium text-sm lg:text-base">{profile?.full_name || user?.email}</p>
              <div className="flex items-center lg:justify-end space-x-2">
                {getRoleIcon(userRole || 'employee')}
                <Badge variant="secondary" className="text-xs">
                  {getRoleDisplay(userRole || 'employee')}
                </Badge>
              </div>
            </div>
            
            <Button variant="outline" size="sm" onClick={signOut} className="w-full lg:w-auto">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 lg:p-6">
        <div className="mb-6 lg:mb-8">
          <p className="text-sm lg:text-base text-muted-foreground">
            {getDashboardMessage(userRole || 'employee')}
          </p>
        </div>

        {/* Time Clock Section - Show for all users */}
        <div className="mb-8">
          <ClockInOut compact={true} />
        </div>

        {/* Quick Actions for Admin and HR */}
        {(userRole === 'admin' || userRole === 'hr') && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>
                  Quickly manage events and holidays
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button asChild className="h-12">
                    <Link to="/calendar">
                      <Calendar className="mr-2 h-4 w-4" />
                      Create Event
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-12">
                    <Link to="/holiday-management">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Add Holiday
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-12">
                    <Link to="/calendar">
                      <Clock className="mr-2 h-4 w-4" />
                      Manage Calendar
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48</div>
              <p className="text-xs text-muted-foreground">+3 new hires</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹125,000</div>
              <p className="text-xs text-muted-foreground">+8% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">₹24,500 total</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics Section with Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Calendar Widget */}
          <div className="lg:col-span-1">
            <AgencyCalendar compact />
          </div>
          {/* Charts Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Monthly Revenue vs Expenses */}
            {(userRole === 'admin' || userRole === 'finance_manager') && (
              <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base lg:text-lg">Monthly Revenue vs Expenses</CardTitle>
                <CardDescription className="text-sm">Financial performance over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent className="px-2 lg:px-6">
                <div className="w-full overflow-x-auto">
                  <ResponsiveContainer width="100%" height={250} minWidth={300}>
                    <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        interval={0}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `₹${(value/1000)}k`}
                      />
                      <Tooltip 
                        formatter={(value) => [`₹${value.toLocaleString()}`, '']}
                        contentStyle={{ fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="revenue" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="expenses" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Mobile Legend */}
                <div className="flex justify-center gap-4 mt-3 lg:hidden">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Revenue</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Expenses</span>
                  </div>
                </div>
              </CardContent>
              </Card>
            )}

            {/* Weekly Attendance */}
            {(userRole === 'admin' || userRole === 'hr') && (
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
                      <XAxis 
                        dataKey="day" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip contentStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="present" fill="#22c55e" name="Present" />
                      <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Mobile Stats */}
                <div className="grid grid-cols-2 gap-3 mt-3 lg:hidden">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-600">230</div>
                    <div className="text-xs text-green-700">Total Present</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="text-lg font-bold text-red-600">10</div>
                    <div className="text-xs text-red-700">Total Absent</div>
                  </div>
                </div>
              </CardContent>
              </Card>
            )}

            {/* Project Status Overview */}
            {userRole === 'admin' && (
              <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base lg:text-lg">Project Status Overview</CardTitle>
                <CardDescription className="text-sm">Distribution of projects by status</CardDescription>
              </CardHeader>
              <CardContent className="px-2 lg:px-6">
                <div className="flex flex-col lg:block">
                  {/* Chart */}
                  <div className="w-full overflow-x-auto lg:overflow-visible">
                    <ResponsiveContainer width="100%" height={200} minWidth={200}>
                      <PieChart>
                        <Pie
                          data={projectStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
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
                  
                  {/* Mobile Legend */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {projectStatusData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs p-2 bg-muted/30 rounded">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: entry.color }}
                        />
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

        {/* Employee Task Progress / Upcoming Deadlines Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {userRole === 'employee' ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base lg:text-lg">My Task Progress</CardTitle>
                <CardDescription className="text-sm">Your assigned tasks completion rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">This Week</span>
                      <span className="text-lg font-bold text-primary">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">This Month</span>
                      <span className="text-lg font-bold text-primary">72%</span>
                    </div>
                    <Progress value={72} className="h-2" />
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Overall</span>
                      <span className="text-lg font-bold text-primary">89%</span>
                    </div>
                    <Progress value={89} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <AlertCircle className="h-4 w-4 lg:h-5 lg:w-5 text-orange-500 flex-shrink-0" />
                  <span>Upcoming Deadlines</span>
                </CardTitle>
                <CardDescription className="text-sm">Projects and tasks due in the next 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[280px] overflow-y-auto">
                  {assignedProjects
                    .filter(project => {
                      const daysLeft = getDaysUntilDeadline(project.deadline);
                      return daysLeft <= 30 && daysLeft >= 0;
                    })
                    .sort((a, b) => getDaysUntilDeadline(a.deadline) - getDaysUntilDeadline(b.deadline))
                    .map((project) => {
                      const daysLeft = getDaysUntilDeadline(project.deadline);
                      const urgencyColor = daysLeft <= 3 ? 'text-red-600' : daysLeft <= 7 ? 'text-orange-600' : 'text-yellow-600';
                      const urgencyBg = daysLeft <= 3 ? 'bg-red-50 border-red-200' : daysLeft <= 7 ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200';
                      
                      return (
                        <div key={project.id} className={`p-3 rounded-lg border ${urgencyBg}`}>
                          <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                            <h4 className="font-medium text-sm truncate pr-2">{project.name}</h4>
                            <Badge variant="outline" className={`text-xs ${urgencyColor} border-current self-start lg:self-auto flex-shrink-0`}>
                              {daysLeft === 0 ? 'Due Today' : daysLeft === 1 ? '1 day' : `${daysLeft} days`}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 mt-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="truncate">{project.client}</span>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`}></div>
                                  <span className="capitalize hidden sm:inline">{project.status}</span>
                                </div>
                                <span className="font-medium">{project.progress}%</span>
                              </div>
                            </div>
                            <Progress value={project.progress} className="h-1.5" />
                          </div>
                        </div>
                      );
                    })}
                  {assignedProjects.filter(project => {
                    const daysLeft = getDaysUntilDeadline(project.deadline);
                    return daysLeft <= 30 && daysLeft >= 0;
                  }).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No upcoming deadlines in the next 30 days</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Project Timeline Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {userRole === 'employee' ? 'My Assigned Projects' : 'Active Projects'}
              </CardTitle>
              <CardDescription>
                {userRole === 'employee' 
                  ? 'Projects you are currently working on' 
                  : 'Current project status and timelines'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignedProjects.map((project) => {
                  const daysLeft = getDaysUntilDeadline(project.deadline);
                  return (
                    <div key={project.id} className="border rounded-lg p-3 lg:p-4">
                      <div className="flex flex-col space-y-3 mb-4">
                        <div className="flex flex-col space-y-2">
                          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                            <h3 className="font-semibold text-base lg:text-lg">{project.name}</h3>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${getPriorityColor(project.priority)}`}
                              >
                                {project.priority}
                              </Badge>
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`}></div>
                                <span className="text-sm text-muted-foreground capitalize">{project.status}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">Client: {project.client}</p>
                        </div>
                        
                        {/* Progress Section */}
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-lg font-bold text-primary">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="w-full h-2" />
                        </div>
                        
                        {/* Project Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="font-medium">Due Date</p>
                              <p className="text-muted-foreground">{new Date(project.deadline).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="font-medium">Time Left</p>
                              <p className={`${daysLeft < 7 ? 'text-red-600' : daysLeft < 14 ? 'text-yellow-600' : 'text-green-600'}`}>
                                {daysLeft > 0 ? `${daysLeft} days` : `${Math.abs(daysLeft)} overdue`}
                                {daysLeft < 7 && daysLeft > 0 && <AlertCircle className="inline h-3 w-3 ml-1" />}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="font-medium">Team</p>
                              <p className="text-muted-foreground">{project.team.length} members</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Team Members & Actions */}
                      <div className="border-t pt-3 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Team:</span>
                          <div className="flex gap-1">
                            {project.team.slice(0, 4).map((member, index) => (
                              <div key={index} className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                                {member.charAt(0)}
                              </div>
                            ))}
                            {project.team.length > 4 && (
                              <div className="w-7 h-7 bg-muted rounded-full flex items-center justify-center text-xs">
                                +{project.team.length - 4}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            View Details
                          </Button>
                          {userRole !== 'employee' && (
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                              Edit Project
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role-specific Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <p className="text-sm font-medium">Project Alpha milestone completed</p>
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
                    <p className="text-sm font-medium">Invoice #INV-001 payment received</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks for your role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">{/* Changed from grid-cols-2 to accommodate 4 buttons per role */}
                {userRole === 'admin' && (
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
                        <Building className="h-6 w-6" />
                        <span className="text-sm">Manage Clients</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                      <Link to="/reports">
                        <DollarSign className="h-6 w-6" />
                        <span className="text-sm">View Reports</span>
                      </Link>
                    </Button>
                  </>
                )}
                
                {userRole === 'hr' && (
                  <>
                    <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                      <Link to="/employees">
                        <Users className="h-6 w-6" />
                        <span className="text-sm">Employee Records</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                      <Link to="/payroll">
                        <Calculator className="h-6 w-6" />
                        <span className="text-sm">Process Payroll</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                      <Link to="/attendance">
                        <Users className="h-6 w-6" />
                        <span className="text-sm">Track Attendance</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                      <Link to="/leave-requests">
                        <Calculator className="h-6 w-6" />
                        <span className="text-sm">Leave Requests</span>
                      </Link>
                    </Button>
                  </>
                )}

                {userRole === 'finance_manager' && (
                  <>
                    <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                      <Link to="/invoices">
                        <DollarSign className="h-6 w-6" />
                        <span className="text-sm">Create Invoice</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                      <Link to="/ledger">
                        <Calculator className="h-6 w-6" />
                        <span className="text-sm">View Ledger</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                      <Link to="/payments">
                        <DollarSign className="h-6 w-6" />
                        <span className="text-sm">Track Payments</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                      <Link to="/reports">
                        <Calculator className="h-6 w-6" />
                        <span className="text-sm">View Reports</span>
                      </Link>
                    </Button>
                  </>
                )}

                {userRole === 'employee' && (
                  <>
                    <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                      <Link to="/my-profile">
                        <User className="h-6 w-6" />
                        <span className="text-sm">My Profile</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                      <Link to="/my-attendance">
                        <Building className="h-6 w-6" />
                        <span className="text-sm">My Attendance</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                      <Link to="/my-leave">
                        <User className="h-6 w-6" />
                        <span className="text-sm">My Leave</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-20 flex flex-col space-y-2">
                      <Link to="/settings">
                        <Calculator className="h-6 w-6" />
                        <span className="text-sm">Settings</span>
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
