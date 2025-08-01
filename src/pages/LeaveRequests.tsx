import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Clock, Calendar, User } from "lucide-react";

const LeaveRequests = () => {
  // Mock data - replace with actual API calls
  const leaveRequests = [
    {
      id: 1,
      employee: "John Doe",
      type: "Annual Leave",
      startDate: "2024-02-15",
      endDate: "2024-02-20",
      days: 5,
      reason: "Family vacation",
      status: "pending",
      submittedDate: "2024-01-28"
    },
    {
      id: 2,
      employee: "Jane Smith",
      type: "Sick Leave",
      startDate: "2024-02-05",
      endDate: "2024-02-07",
      days: 3,
      reason: "Medical appointment",
      status: "approved",
      submittedDate: "2024-01-30"
    },
    {
      id: 3,
      employee: "Mike Johnson",
      type: "Personal Leave",
      startDate: "2024-03-01",
      endDate: "2024-03-02",
      days: 2,
      reason: "Personal matters",
      status: "rejected",
      submittedDate: "2024-01-25"
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
      case 'approved': return <Check className="h-3 w-3" />;
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'rejected': return <X className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const filterByStatus = (status: string) => {
    if (status === 'all') return leaveRequests;
    return leaveRequests.filter(request => request.status === status);
  };

  const RequestCard = ({ request }: { request: any }) => (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{request.employee}</h3>
              <p className="text-sm text-muted-foreground">{request.type}</p>
            </div>
          </div>
          <Badge variant={getStatusColor(request.status)} className="flex items-center gap-1">
            {getStatusIcon(request.status)}
            {request.status}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
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
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-muted-foreground text-sm">Reason</p>
          <p className="text-sm">{request.reason}</p>
        </div>
        
        {request.status === 'pending' && (
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="default">
              <Check className="mr-1 h-3 w-3" />
              Approve
            </Button>
            <Button size="sm" variant="outline">
              <X className="mr-1 h-3 w-3" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Leave Requests</h1>
          <p className="text-muted-foreground">Review and manage employee leave requests</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Leave Calendar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            {filterByStatus('all').map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="pending" className="mt-6">
          <div className="space-y-4">
            {filterByStatus('pending').map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="approved" className="mt-6">
          <div className="space-y-4">
            {filterByStatus('approved').map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-6">
          <div className="space-y-4">
            {filterByStatus('rejected').map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeaveRequests;