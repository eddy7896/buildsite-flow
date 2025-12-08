import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Clock, Calendar, User, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from '@/lib/database';
import { useToast } from "@/hooks/use-toast";

interface LeaveRequest {
  id: string;
  employee: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  submittedDate: string;
  employee_id?: string;
}

const LeaveRequests = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [selectedTab, setSelectedTab] = useState('all');

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      
      // Fetch leave requests with leave types
      const { data: leaveData, error: leaveError } = await db
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (leaveError) throw leaveError;

      // Fetch leave types for names
      const { data: leaveTypes, error: typesError } = await db
        .from('leave_types')
        .select('id, name');

      if (typesError) throw typesError;

      const leaveTypeMap = new Map((leaveTypes || []).map((lt: any) => [lt.id, lt.name]));

      // Fetch employee details and profiles
      const employeeIds = (leaveData || []).map(l => l.employee_id).filter(Boolean);
      let employees: any[] = [];
      let profiles: any[] = [];

      if (employeeIds.length > 0) {
        const { data: employeesData, error: employeesError } = await db
          .from('employee_details')
          .select('user_id, first_name, last_name')
          .in('user_id', employeeIds);

        if (employeesError) throw employeesError;
        employees = employeesData || [];

        const userIds = employees.map(e => e.user_id).filter(Boolean);
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await db
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', userIds);

          if (profilesError) throw profilesError;
          profiles = profilesData || [];
        }
      }

      const profileMap = new Map(profiles.map((p: any) => [p.user_id, p.full_name]));
      const employeeMap = new Map(employees.map((e: any) => [e.user_id, e]));

      // Transform leave requests
      const transformedRequests: LeaveRequest[] = (leaveData || []).map((request: any) => {
        const employee = employeeMap.get(request.employee_id);
        const fullName = profileMap.get(request.employee_id) || 
          (employee ? `${employee.first_name} ${employee.last_name}`.trim() : 'Unknown Employee');
        const leaveTypeName = leaveTypeMap.get(request.leave_type_id) || 'Leave';

        // Calculate days between start and end date
        const start = new Date(request.start_date);
        const end = new Date(request.end_date);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        return {
          id: request.id,
          employee: fullName,
          type: leaveTypeName,
          startDate: request.start_date,
          endDate: request.end_date,
          days: request.total_days || days,
          reason: request.reason || 'No reason provided',
          status: request.status || 'pending',
          submittedDate: request.created_at,
          employee_id: request.employee_id
        };
      });

      setLeaveRequests(transformedRequests);

    } catch (error: any) {
      console.error('Error fetching leave requests:', error);
      toast({
        title: "Error",
        description: "Failed to load leave requests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await db
        .from('leave_requests')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Leave request approved",
      });

      fetchLeaveRequests();
    } catch (error: any) {
      console.error('Error approving leave request:', error);
      toast({
        title: "Error",
        description: "Failed to approve leave request",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await db
        .from('leave_requests')
        .update({ 
          status: 'rejected'
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Leave request rejected",
      });

      fetchLeaveRequests();
    } catch (error: any) {
      console.error('Error rejecting leave request:', error);
      toast({
        title: "Error",
        description: "Failed to reject leave request",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading leave requests...</span>
        </div>
      </div>
    );
  }

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

  const filteredRequests = filterByStatus(selectedTab);

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
            <Button 
              size="sm" 
              variant="default"
              onClick={() => handleApprove(request.id)}
            >
              <Check className="mr-1 h-3 w-3" />
              Approve
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleReject(request.id)}
            >
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

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Requests ({leaveRequests.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({filterByStatus('pending').length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({filterByStatus('approved').length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({filterByStatus('rejected').length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value={selectedTab} className="mt-6">
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No {selectedTab === 'all' ? '' : selectedTab} leave requests found.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeaveRequests;