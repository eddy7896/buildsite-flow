import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, Search, Filter, Download, Eye, Upload, FileText, DollarSign, Calendar, Tag, 
  Loader2, Edit, Trash2, CheckCircle, XCircle, X 
} from "lucide-react";
import { useState, useEffect } from "react";
import { selectRecords, deleteRecord, updateRecord } from '@/services/api/postgresql-service';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ReceiptFormDialog } from "@/components/ReceiptFormDialog";
import { ReceiptViewDialog } from "@/components/ReceiptViewDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface Receipt {
  id: string;
  vendor: string;
  category: string;
  amount: number;
  date: string;
  status: string;
  description: string;
  receiptUrl: string | null;
  request_id?: string;
  category_id?: string;
  business_purpose?: string;
  employee_id?: string;
}

interface ReceiptStats {
  totalReceipts: number;
  totalAmount: number;
  thisMonth: number;
  pendingReview: number;
}

const Receipts = () => {
  const { toast } = useToast();
  const { user, userRole, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [receiptStats, setReceiptStats] = useState<ReceiptStats>({
    totalReceipts: 0,
    totalAmount: 0,
    thisMonth: 0,
    pendingReview: 0
  });
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  
  // Dialog states
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null);
  const [receiptToUpdateStatus, setReceiptToUpdateStatus] = useState<{ receipt: Receipt; newStatus: string } | null>(null);

  const isFinanceManager = userRole === 'admin' || userRole === 'finance_manager';

  useEffect(() => {
    if (profile?.agency_id) {
      fetchReceipts();
      fetchCategories();
    }
  }, [profile?.agency_id]);

  const fetchCategories = async () => {
    try {
      if (!profile?.agency_id) {
        setCategories([]);
        return;
      }

      const categoriesData = await selectRecords('expense_categories', {
        where: { 
          agency_id: profile.agency_id,
          is_active: true 
        },
        orderBy: 'name ASC',
      });
      
      setCategories((categoriesData || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name
      })));
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load expense categories",
        variant: "destructive",
      });
    }
  };

  const fetchReceipts = async () => {
    try {
      setLoading(true);

      if (!profile?.agency_id) {
        setReceipts([]);
        setReceiptStats({
          totalReceipts: 0,
          totalAmount: 0,
          thisMonth: 0,
          pendingReview: 0
        });
        return;
      }

      // Fetch reimbursement requests with agency_id filter
      const requests = await selectRecords('reimbursement_requests', {
        where: { agency_id: profile.agency_id },
        orderBy: 'created_at DESC',
      });

      if (!requests || requests.length === 0) {
        setReceipts([]);
        setReceiptStats({
          totalReceipts: 0,
          totalAmount: 0,
          thisMonth: 0,
          pendingReview: 0
        });
        return;
      }

      // Fetch expense categories
      const categoriesData = await selectRecords('expense_categories', {
        where: { agency_id: profile.agency_id },
      });

      const categoryMap = new Map((categoriesData || []).map((c: any) => [c.id, c.name]));

      // Fetch attachments for all requests
      const requestIds = requests.map((r: any) => r.id).filter(Boolean);
      let attachments: any[] = [];
      
      if (requestIds.length > 0) {
        attachments = await selectRecords('reimbursement_attachments', {
          where: { 
            reimbursement_id: { operator: 'IN', value: requestIds }
          },
        });
      }

      const attachmentsMap = new Map(attachments.map((a: any) => [a.reimbursement_id, a]));

      // Fetch employee profiles for vendor names
      const employeeIds = requests.map((r: any) => r.employee_id).filter(Boolean);
      let profiles: any[] = [];

      if (employeeIds.length > 0) {
        profiles = await selectRecords('profiles', {
          where: { 
            user_id: { operator: 'IN', value: employeeIds }
          },
        });
      }

      const profileMap = new Map(profiles.map((p: any) => [p.user_id, p.full_name]));

      // Transform reimbursement requests to receipts
      const transformedReceipts: Receipt[] = requests.map((request: any) => {
        const attachment = attachmentsMap.get(request.id);
        const categoryName = categoryMap.get(request.category_id) || 'Uncategorized';
        const vendorName = profileMap.get(request.employee_id) || 'Unknown Employee';

        return {
          id: request.id.substring(0, 8).toUpperCase(),
          vendor: vendorName,
          category: categoryName,
          amount: Number(request.amount || 0),
          date: request.expense_date || request.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          status: request.status || 'submitted',
          description: request.description || request.notes || 'No description',
          receiptUrl: attachment?.file_path || null,
          request_id: request.id,
          category_id: request.category_id,
          business_purpose: request.business_purpose,
          employee_id: request.employee_id
        };
      });

      setReceipts(transformedReceipts);

      // Calculate stats
      const totalReceipts = transformedReceipts.length;
      const totalAmount = transformedReceipts.reduce((sum, r) => sum + r.amount, 0);
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const thisMonth = transformedReceipts.filter(r => {
        const receiptDate = new Date(r.date);
        return receiptDate.getMonth() === currentMonth && receiptDate.getFullYear() === currentYear;
      }).length;

      const pendingReview = transformedReceipts.filter(r => 
        r.status === 'submitted' || r.status === 'manager_review' || r.status === 'finance_review'
      ).length;

      setReceiptStats({
        totalReceipts,
        totalAmount: Math.round(totalAmount),
        thisMonth,
        pendingReview
      });

    } catch (error: any) {
      console.error('Error fetching receipts:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to load receipts. Please try again.",
        variant: "destructive",
      });
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!receiptToDelete?.request_id || !user?.id) return;

    try {
      // First delete attachments
      const attachments = await selectRecords('reimbursement_attachments', {
        where: { reimbursement_id: receiptToDelete.request_id },
      });

      for (const attachment of attachments || []) {
        await deleteRecord('reimbursement_attachments', attachment.id, user.id);
      }

      // Then delete the reimbursement request
      await deleteRecord('reimbursement_requests', receiptToDelete.request_id, user.id);

      toast({
        title: "Success",
        description: "Receipt deleted successfully",
      });

      setReceiptToDelete(null);
      fetchReceipts();
    } catch (error: any) {
      console.error('Error deleting receipt:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete receipt",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async () => {
    if (!receiptToUpdateStatus?.receipt.request_id || !user?.id) return;

    try {
      const updateData: any = {
        status: receiptToUpdateStatus.newStatus,
      };

      if (receiptToUpdateStatus.newStatus === 'approved') {
        updateData.reviewed_by = user.id;
        updateData.reviewed_at = new Date().toISOString();
      } else if (receiptToUpdateStatus.newStatus === 'rejected') {
        updateData.reviewed_by = user.id;
        updateData.reviewed_at = new Date().toISOString();
      }

      await updateRecord('reimbursement_requests', updateData, { id: receiptToUpdateStatus.receipt.request_id }, user.id);

      toast({
        title: "Success",
        description: `Receipt ${receiptToUpdateStatus.newStatus} successfully`,
      });

      setReceiptToUpdateStatus(null);
      fetchReceipts();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update receipt status",
        variant: "destructive",
      });
    }
  };

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = 
      receipt.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || receipt.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || receipt.category_id === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading receipts...</span>
        </div>
      </div>
    );
  }

  if (!profile?.agency_id) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Unable to load receipts. Please ensure you are logged in.</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': 
      case 'paid': return 'default';
      case 'submitted': 
      case 'manager_review':
      case 'finance_review': return 'secondary';
      case 'rejected': return 'destructive';
      case 'draft': return 'outline';
      default: return 'secondary';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'office supplies': return 'bg-blue-100 text-blue-800';
      case 'software': return 'bg-green-100 text-green-800';
      case 'travel': return 'bg-purple-100 text-purple-800';
      case 'meals': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Receipts</h1>
          <p className="text-muted-foreground">Manage expense receipts and reimbursements</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => {
            setSelectedReceipt(null);
            setShowFormDialog(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Receipts</p>
                <p className="text-2xl font-bold">{receiptStats.totalReceipts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">₹{receiptStats.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{receiptStats.thisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Tag className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{receiptStats.pendingReview}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search receipts..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="manager_review">Manager Review</SelectItem>
                <SelectItem value="finance_review">Finance Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Receipts</CardTitle>
          <CardDescription>Latest expense receipts and their approval status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReceipts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
                    ? 'No receipts found matching your filters.' 
                    : 'No receipts found.'}
                </p>
              </div>
            ) : (
              filteredReceipts.map((receipt) => (
              <div key={receipt.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{receipt.vendor}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{receipt.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{receipt.id}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(receipt.category)}`}>
                        {receipt.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right mr-4">
                  <p className="font-bold text-lg">₹{receipt.amount.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(receipt.date), "MMM dd, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={getStatusColor(receipt.status)}>
                    {receipt.status}
                  </Badge>
                  <div className="flex gap-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedReceipt(receipt);
                        setShowViewDialog(true);
                      }}
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {(user?.id === receipt.employee_id || isFinanceManager) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedReceipt(receipt);
                          setShowFormDialog(true);
                        }}
                        title="Edit receipt"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {isFinanceManager && (receipt.status === 'submitted' || receipt.status === 'manager_review' || receipt.status === 'finance_review') && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setReceiptToUpdateStatus({ receipt, newStatus: 'approved' });
                          }}
                          title="Approve"
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setReceiptToUpdateStatus({ receipt, newStatus: 'rejected' });
                          }}
                          title="Reject"
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {(user?.id === receipt.employee_id || isFinanceManager) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setReceiptToDelete(receipt)}
                        title="Delete receipt"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <ReceiptFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        onSuccess={fetchReceipts}
        receipt={selectedReceipt}
      />

      {/* View Dialog */}
      <ReceiptViewDialog
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        receipt={selectedReceipt}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!receiptToDelete} onOpenChange={(open) => !open && setReceiptToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the receipt
              and all associated attachments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Update Confirmation Dialog */}
      <AlertDialog open={!!receiptToUpdateStatus} onOpenChange={(open) => !open && setReceiptToUpdateStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Receipt Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {receiptToUpdateStatus?.newStatus} this receipt?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusUpdate}>
              {receiptToUpdateStatus?.newStatus === 'approved' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Receipts;
