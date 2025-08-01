import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { LogOut, User, Building, Users, Calculator, DollarSign } from 'lucide-react';

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
              <div className="text-2xl font-bold">$125,000</div>
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
              <p className="text-xs text-muted-foreground">$24,500 total</p>
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
