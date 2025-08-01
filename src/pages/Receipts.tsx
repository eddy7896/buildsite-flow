import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, Eye, Upload, FileText, DollarSign, Calendar, Tag } from "lucide-react";

const Receipts = () => {
  // Mock data - replace with actual API calls
  const receiptStats = {
    totalReceipts: 234,
    totalAmount: 78500,
    thisMonth: 45,
    pendingReview: 8
  };

  const receipts = [
    {
      id: "RCP-001",
      vendor: "Office Supplies Co",
      category: "Office Supplies",
      amount: 245.50,
      date: "2024-01-15",
      status: "approved",
      description: "Stationery and paper supplies",
      receiptUrl: "#"
    },
    {
      id: "RCP-002",
      vendor: "Tech Solutions Inc",
      category: "Software",
      amount: 1200.00,
      date: "2024-01-18",
      status: "pending",
      description: "Software license renewal",
      receiptUrl: "#"
    },
    {
      id: "RCP-003",
      vendor: "Business Travel Agency",
      category: "Travel",
      amount: 850.75,
      date: "2024-01-20",
      status: "approved",
      description: "Flight tickets for business trip",
      receiptUrl: "#"
    },
    {
      id: "RCP-004",
      vendor: "Restaurant & Catering",
      category: "Meals",
      amount: 125.30,
      date: "2024-01-22",
      status: "rejected",
      description: "Client dinner meeting",
      receiptUrl: "#"
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
                <p className="text-2xl font-bold">${receiptStats.totalAmount.toLocaleString()}</p>
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
              <Input placeholder="Search receipts..." className="pl-10" />
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
            {receipts.map((receipt) => (
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
                  <p className="font-bold text-lg">${receipt.amount.toFixed(2)}</p>
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Receipts;