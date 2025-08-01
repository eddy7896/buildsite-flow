import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, Clock, CheckCircle, XCircle, Plane, Heart, User } from "lucide-react";

const MyLeave = () => {
  // Mock data - replace with actual user leave data
  const leaveBalance = {
    annual: { total: 25, used: 8, remaining: 17 },
    sick: { total: 10, used: 2, remaining: 8 },
    personal: { total: 5, used: 1, remaining: 4 },
    maternity: { total: 90, used: 0, remaining: 90 }
  };

  const myLeaveRequests = [
    {
      id: "LR-001",
      type: "Annual Leave",
      startDate: "2024-03-15",
      endDate: "2024-03-20",
      days: 5,
      reason: "Family vacation",
      status: "pending",
      submittedDate: "2024-01-28",
      approver: "Jane Smith"
    },
    {
      id: "LR-002",
      type: "Sick Leave",
      startDate: "2024-02-05",
      endDate: "2024-02-07",
      days: 3,
      reason: "Medical appointment",
      status: "approved",
      submittedDate: "2024-01-30",
      approver: "Jane Smith"
    },
    {
      id: "LR-003",
      type: "Personal Leave",
      startDate: "2024-01-20",
      endDate: "2024-01-20",
      days: 1,
      reason: "Personal matters",
      status: "rejected",
      submittedDate: "2024-01-15",
      approver: "Jane Smith"
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getLeaveIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'annual leave': return <Plane className="h-5 w-5" />;
      case 'sick leave': return <Heart className="h-5 w-5" />;
      case 'personal leave': return <User className="h-5 w-5" />;
      default: return <Calendar className="h-5 w-5" />;
    }
  };

  const LeaveBalanceCard = ({ title, balance, icon, color }: any) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${color}`}>
              {icon}
            </div>
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{balance.remaining} days left</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{balance.used}/{balance.total}</p>
            <p className="text-xs text-muted-foreground">Used/Total</p>
          </div>
        </div>
        <Progress value={(balance.used / balance.total) * 100} className="h-2" />
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Leave</h1>
          <p className="text-muted-foreground">Manage your leave requests and view balances</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Request Leave
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <LeaveBalanceCard
          title="Annual Leave"
          balance={leaveBalance.annual}
          icon={<Plane className="h-5 w-5 text-blue-600" />}
          color="bg-blue-100"
        />
        <LeaveBalanceCard
          title="Sick Leave"
          balance={leaveBalance.sick}
          icon={<Heart className="h-5 w-5 text-red-600" />}
          color="bg-red-100"
        />
        <LeaveBalanceCard
          title="Personal Leave"
          balance={leaveBalance.personal}
          icon={<User className="h-5 w-5 text-green-600" />}
          color="bg-green-100"
        />
        <LeaveBalanceCard
          title="Maternity Leave"
          balance={leaveBalance.maternity}
          icon={<Heart className="h-5 w-5 text-purple-600" />}
          color="bg-purple-100"
        />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave Request History</CardTitle>
              <CardDescription>All your leave requests and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myLeaveRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {getLeaveIcon(request.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{request.type}</h3>
                            <p className="text-sm text-muted-foreground">Request ID: {request.id}</p>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(request.status)} className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          {request.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">
                            {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-muted-foreground">{request.days} days</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Submitted</p>
                          <p className="font-medium">{new Date(request.submittedDate).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">Approver: {request.approver}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground text-sm">Reason</p>
                        <p className="text-sm">{request.reason}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
              <CardDescription>Leave requests awaiting approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myLeaveRequests.filter(r => r.status === 'pending').map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {getLeaveIcon(request.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{request.type}</h3>
                            <p className="text-sm text-muted-foreground">Request ID: {request.id}</p>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(request.status)} className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          {request.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">
                            {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-muted-foreground">{request.days} days</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Submitted</p>
                          <p className="font-medium">{new Date(request.submittedDate).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">Approver: {request.approver}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground text-sm">Reason</p>
                        <p className="text-sm">{request.reason}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="approved" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Approved Requests</CardTitle>
              <CardDescription>Your approved leave requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myLeaveRequests.filter(r => r.status === 'approved').map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {getLeaveIcon(request.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{request.type}</h3>
                            <p className="text-sm text-muted-foreground">Request ID: {request.id}</p>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(request.status)} className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          {request.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">
                            {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-muted-foreground">{request.days} days</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Submitted</p>
                          <p className="font-medium">{new Date(request.submittedDate).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">Approver: {request.approver}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground text-sm">Reason</p>
                        <p className="text-sm">{request.reason}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Requests</CardTitle>
              <CardDescription>Leave requests that were not approved</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myLeaveRequests.filter(r => r.status === 'rejected').map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {getLeaveIcon(request.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{request.type}</h3>
                            <p className="text-sm text-muted-foreground">Request ID: {request.id}</p>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(request.status)} className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          {request.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">
                            {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-muted-foreground">{request.days} days</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Submitted</p>
                          <p className="font-medium">{new Date(request.submittedDate).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">Approver: {request.approver}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground text-sm">Reason</p>
                        <p className="text-sm">{request.reason}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyLeave;