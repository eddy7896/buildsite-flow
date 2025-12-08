import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReimbursementFormDialog } from "@/components/ReimbursementFormDialog";
import { ReimbursementReviewDialog } from "@/components/ReimbursementReviewDialog";
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/database';
import { useAuth } from "@/hooks/useAuth";
import { Plus, Search, DollarSign, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";

interface ReimbursementRequest {
  id: string;
  employee_id: string;
  amount: number;
  currency: string;
  expense_date: string;
  description: string;
  business_purpose: string;
  status: string;
  submitted_at: string;
  created_at: string;
  expense_categories: {
    name: string;
  };
  profiles?: {
    full_name: string;
  };
}

export const Reimbursements: React.FC = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ReimbursementRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [requests, setRequests] = useState<ReimbursementRequest[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0,
  });

  const isFinanceManager = userRole === 'admin' || userRole === 'finance_manager';

  useEffect(() => {
    if (user) {
      fetchReimbursements();
    }
  }, [user]);

  const fetchReimbursements = async () => {
    try {
      setLoading(true);
      const { data, error } = await db
        .from("reimbursement_requests")
        .select(`
          *,
          expense_categories (
            name
          ),
          profiles (
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRequests((data as any) || []);
      
      // Calculate stats
      const totalAmount = data?.reduce((sum, req) => sum + Number(req.amount), 0) || 0;
      const pending = data?.filter(req => req.status === 'submitted' || req.status === 'draft').length || 0;
      const approved = data?.filter(req => req.status === 'approved').length || 0;
      const rejected = data?.filter(req => req.status === 'rejected').length || 0;

      setStats({
        total: data?.length || 0,
        pending,
        approved,
        rejected,
        totalAmount,
      });
    } catch (error) {
      console.error("Error fetching reimbursements:", error);
      toast({
        title: "Error",
        description: "Failed to load reimbursement requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request: ReimbursementRequest) => {
    setSelectedRequest(request);
    setShowReviewDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-muted text-muted-foreground";
      case "submitted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "paid":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return <Clock className="h-4 w-4" />;
      case "approved":
      case "paid":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const filteredRequests = requests.filter(request =>
    request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.expense_categories?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isFinanceManager ? "Reimbursement Requests" : "My Reimbursements"}
          </h1>
          <p className="text-muted-foreground">
            {isFinanceManager 
              ? "Review and approve employee reimbursement requests" 
              : "Submit and track your expense reimbursement requests"
            }
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Reimbursement Requests</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {requests.length === 0 ? "No reimbursement requests yet." : "No requests match your search."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    {isFinanceManager && <TableHead>Employee</TableHead>}
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        {format(new Date(request.expense_date), "MMM dd, yyyy")}
                      </TableCell>
                      {isFinanceManager && (
                        <TableCell>
                          <span className="font-medium">
                            {request.profiles?.full_name || "Unknown Employee"}
                          </span>
                        </TableCell>
                      )}
                      <TableCell>
                        <span className="font-medium">
                          {request.expense_categories?.name || "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.description}</p>
                          {request.business_purpose && (
                            <p className="text-sm text-muted-foreground">
                              {request.business_purpose}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {request.currency} {Number(request.amount).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`flex items-center gap-1 ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.submitted_at
                          ? format(new Date(request.submitted_at), "MMM dd, yyyy")
                          : "Not submitted"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewRequest(request)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          {isFinanceManager ? "Review" : "View"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ReimbursementFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={fetchReimbursements}
      />

      <ReimbursementReviewDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        request={selectedRequest}
        onSuccess={fetchReimbursements}
      />
    </div>
  );
};