import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { LogOut, User, Building, Users, Calculator, DollarSign, Calendar, Clock, TrendingUp, AlertCircle } from 'lucide-react';

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
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name || 'User'}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-medium">{profile?.full_name || user?.email}</p>
              <div className="flex items-center justify-end space-x-2">
                {getRoleIcon(userRole || 'employee')}
                <Badge variant="secondary">
                  {getRoleDisplay(userRole || 'employee')}
                </Badge>
              </div>
            </div>
            
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6">
        <div className="mb-8">
          <p className="text-muted-foreground">
            {getDashboardMessage(userRole || 'employee')}
          </p>
        </div>

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

        {/* Charts and Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {(userRole === 'admin' || userRole === 'finance_manager') && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue vs Expenses</CardTitle>
                <CardDescription>Financial performance over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, '']} />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="expenses" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {(userRole === 'admin' || userRole === 'hr') && (
            <Card>
              <CardHeader>
                <CardTitle>Weekly Attendance</CardTitle>
                <CardDescription>Employee attendance for this week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="present" fill="#22c55e" name="Present" />
                    <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {userRole === 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle>Project Status Overview</CardTitle>
                <CardDescription>Distribution of projects by status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {userRole === 'employee' && (
            <Card>
              <CardHeader>
                <CardTitle>My Task Progress</CardTitle>
                <CardDescription>Your assigned tasks completion rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>This Week</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>This Month</span>
                      <span>72%</span>
                    </div>
                    <Progress value={72} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall</span>
                      <span>89%</span>
                    </div>
                    <Progress value={89} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Deadlines Card - Always visible */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Upcoming Deadlines
              </CardTitle>
              <CardDescription>Projects and tasks due in the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[268px] overflow-y-auto">
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
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{project.name}</h4>
                          <Badge variant="outline" className={`text-xs ${urgencyColor} border-current`}>
                            {daysLeft === 0 ? 'Due Today' : daysLeft === 1 ? '1 day' : `${daysLeft} days`}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{project.client}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`}></div>
                              <span className="capitalize">{project.status}</span>
                            </div>
                            <span>{project.progress}%</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Progress value={project.progress} className="h-1" />
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
                    <div key={project.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{project.name}</h3>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getPriorityColor(project.priority)}`}
                            >
                              {project.priority} priority
                            </Badge>
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`}></div>
                              <span className="text-sm text-muted-foreground capitalize">{project.status}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">Client: {project.client}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className={daysLeft < 7 ? 'text-red-600' : daysLeft < 14 ? 'text-yellow-600' : 'text-green-600'}>
                                {daysLeft > 0 ? `${daysLeft} days left` : `${Math.abs(daysLeft)} days overdue`}
                              </span>
                              {daysLeft < 7 && daysLeft > 0 && <AlertCircle className="h-3 w-3 text-red-600" />}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{project.team.length} team members</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold mb-1">{project.progress}%</div>
                          <Progress value={project.progress} className="w-32 h-2" />
                        </div>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Team:</span>
                            <div className="flex gap-1">
                              {project.team.slice(0, 3).map((member, index) => (
                                <div key={index} className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                                  {member.charAt(0)}
                                </div>
                              ))}
                              {project.team.length > 3 && (
                                <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs">
                                  +{project.team.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">View Details</Button>
                            {userRole !== 'employee' && (
                              <Button variant="outline" size="sm">Edit</Button>
                            )}
                          </div>
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
