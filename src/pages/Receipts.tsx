import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, Eye, Upload, FileText, DollarSign, Calendar, Tag, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from '@/lib/database';
import { useToast } from "@/hooks/use-toast";

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
}

interface ReceiptStats {
  totalReceipts: number;
  totalAmount: number;
  thisMonth: number;
  pendingReview: number;
}

const Receipts = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [receiptStats, setReceiptStats] = useState<ReceiptStats>({
    totalReceipts: 0,
    totalAmount: 0,
    thisMonth: 0,
    pendingReview: 0
  });
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);

      // Fetch reimbursement requests with attachments
      const { data: requests, error: requestsError } = await db
        .from('reimbursement_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Fetch expense categories
      const { data: categories, error: categoriesError } = await db
        .from('expense_categories')
        .select('id, name');

      if (categoriesError) throw categoriesError;
      const categoryMap = new Map((categories || []).map((c: any) => [c.id, c.name]));

      // Fetch attachments for all requests
      const requestIds = (requests || []).map(r => r.id).filter(Boolean);
      let attachments: any[] = [];
      
      if (requestIds.length > 0) {
        const { data: attachmentsData, error: attachmentsError } = await db
          .from('reimbursement_attachments')
          .select('*')
          .in('reimbursement_request_id', requestIds);

        if (attachmentsError) throw attachmentsError;
        attachments = attachmentsData || [];
      }

      const attachmentsMap = new Map(attachments.map((a: any) => [a.reimbursement_request_id, a]));

      // Fetch employee profiles for vendor names (using employee name as vendor)
      const employeeIds = (requests || []).map(r => r.employee_id).filter(Boolean);
      let profiles: any[] = [];

      if (employeeIds.length > 0) {
        const { data: profilesData, error: profilesError } = await db
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', employeeIds);

        if (profilesError) throw profilesError;
        profiles = profilesData || [];
      }

      const profileMap = new Map(profiles.map((p: any) => [p.user_id, p.full_name]));

      // Transform reimbursement requests to receipts
      const transformedReceipts: Receipt[] = (requests || []).map((request: any) => {
        const attachment = attachmentsMap.get(request.id);
        const categoryName = categoryMap.get(request.category_id) || 'Uncategorized';
        const vendorName = profileMap.get(request.employee_id) || 'Unknown Employee';

        return {
          id: request.id.substring(0, 8).toUpperCase(),
          vendor: vendorName,
          category: categoryName,
          amount: Number(request.amount || 0),
          date: request.expense_date || request.created_at.split('T')[0],
          status: request.status || 'pending',
          description: request.description || request.notes || 'No description',
          receiptUrl: attachment?.file_path || null,
          request_id: request.id
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

      const pendingReview = transformedReceipts.filter(r => r.status === 'pending').length;

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
        description: "Failed to load receipts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receipts.filter(receipt =>
    receipt.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
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
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Upload Receipt
          </Button>
          <Button>
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
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
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
                  {searchTerm ? 'No receipts found matching your search.' : 'No receipts found.'}
                </p>
              </div>
            ) : (
              filteredReceipts.map((receipt) => (
              <div key={receipt.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{receipt.vendor}</h3>
                    <p className="text-sm text-muted-foreground">{receipt.description}</p>
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
                    {new Date(receipt.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={getStatusColor(receipt.status)}>
                    {receipt.status}
                  </Badge>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Receipts;