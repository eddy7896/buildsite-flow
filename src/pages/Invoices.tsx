import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, Eye, DollarSign, FileText, Calendar, TrendingUp } from "lucide-react";

const Invoices = () => {
  // Mock data - replace with actual API calls
  const invoiceStats = {
    totalInvoices: 156,
    totalAmount: 428500,
    pendingAmount: 45200,
    overdueAmount: 12300
  };

  const invoices = [
    {
      id: "INV-001",
      client: "ABC Corporation",
      amount: 15000,
      issueDate: "2024-01-15",
      dueDate: "2024-02-15",
      status: "paid",
      description: "Web Development Services"
    },
    {
      id: "INV-002",
      client: "XYZ Ltd",
      amount: 8500,
      issueDate: "2024-01-20",
      dueDate: "2024-02-20",
      status: "pending",
      description: "Mobile App Development"
    },
    {
      id: "INV-003",
      client: "Tech Solutions Inc",
      amount: 12000,
      issueDate: "2024-01-10",
      dueDate: "2024-02-10",
      status: "overdue",
      description: "System Integration"
    },
    {
      id: "INV-004",
      client: "Digital Media Co",
      amount: 6500,
      issueDate: "2024-01-25",
      dueDate: "2024-02-25",
      status: "draft",
      description: "Marketing Campaign"
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      case 'draft': return 'outline';
      default: return 'secondary';
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status !== 'paid' && new Date(dueDate) < new Date();
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Invoices</h1>
          <p className="text-sm lg:text-base text-muted-foreground">Manage client invoices and billing</p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:gap-2 sm:space-y-0">
          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">{invoiceStats.totalInvoices}</p>
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
                <p className="text-2xl font-bold">₹{invoiceStats.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">₹{invoiceStats.pendingAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">₹{invoiceStats.overdueAmount.toLocaleString()}</p>
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
              <Input placeholder="Search invoices..." className="pl-10" />
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
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>A list of your recent invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 border rounded-lg space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <div className="flex flex-col space-y-2">
                    <div>
                      <h3 className="font-semibold">{invoice.id}</h3>
                      <p className="text-sm text-muted-foreground">{invoice.client}</p>
                      <p className="text-xs text-muted-foreground">{invoice.description}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 lg:text-right space-y-3 sm:space-y-0">
                  <div className="text-center sm:text-right">
                    <p className="font-bold text-lg">₹{invoice.amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                    {isOverdue(invoice.dueDate, invoice.status) && (
                      <p className="text-xs text-red-600">Overdue</p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 space-y-2 sm:space-y-0">
                    <Badge variant={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
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

export default Invoices;