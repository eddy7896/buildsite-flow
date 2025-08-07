import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download, Eye, DollarSign, FileText, Calendar, TrendingUp, Edit, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import InvoiceFormDialog from "@/components/InvoiceFormDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

interface Invoice {
  id: string;
  client_id: string | null;
  invoice_number: string;
  title: string;
  description: string | null;
  issue_date: string;
  due_date: string | null;
  status: string;
  subtotal: number;
  tax_rate: number;
  total_amount: number | null;
  discount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

const Invoices = () => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch invoices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewInvoice = () => {
    setSelectedInvoice(null);
    setInvoiceFormOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceFormOpen(true);
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleInvoiceSaved = () => {
    fetchInvoices();
  };

  const handleInvoiceDeleted = () => {
    fetchInvoices();
  };

  // Calculate stats from real data
  const invoiceStats = {
    totalInvoices: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
    pendingAmount: invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
    overdueAmount: invoices.filter(inv => inv.status === 'overdue' || (inv.status !== 'paid' && inv.due_date && new Date(inv.due_date) < new Date())).reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      case 'draft': return 'outline';
      default: return 'secondary';
    }
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    return status !== 'paid' && dueDate && new Date(dueDate) < new Date();
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading invoices...</span>
        </div>
      </div>
    );
  }

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
          <Button onClick={handleNewInvoice} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
        <Card className="transition-all hover:shadow-md">
          <CardContent className="pt-4 lg:pt-6">
            <div className="flex items-center">
              <FileText className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 flex-shrink-0" />
              <div className="ml-3 lg:ml-4 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">Total Invoices</p>
                <p className="text-xl lg:text-2xl font-bold">{invoiceStats.totalInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md">
          <CardContent className="pt-4 lg:pt-6">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 lg:h-8 lg:w-8 text-green-600 flex-shrink-0" />
              <div className="ml-3 lg:ml-4 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-lg lg:text-2xl font-bold truncate">₹{invoiceStats.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md">
          <CardContent className="pt-4 lg:pt-6">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-600 flex-shrink-0" />
              <div className="ml-3 lg:ml-4 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-lg lg:text-2xl font-bold truncate">₹{invoiceStats.pendingAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-md">
          <CardContent className="pt-4 lg:pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-red-600 flex-shrink-0" />
              <div className="ml-3 lg:ml-4 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-lg lg:text-2xl font-bold truncate">₹{invoiceStats.overdueAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-3 lg:flex-row lg:space-y-0 lg:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search invoices..." 
                className="pl-10 h-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="w-full lg:w-auto h-10">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>A list of all invoices in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'No invoices found matching your search.' : 'No invoices found.'}
              </p>
              {!searchTerm && (
                <Button 
                  className="mt-4" 
                  onClick={handleNewInvoice}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Invoice
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <Card key={invoice.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                      {/* Invoice Details */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <h3 className="font-semibold text-base lg:text-lg break-words">{invoice.invoice_number}</h3>
                          <p className="text-sm lg:text-base text-muted-foreground break-words">{invoice.title}</p>
                          {invoice.description && (
                            <p className="text-xs lg:text-sm text-muted-foreground break-words">{invoice.description}</p>
                          )}
                        </div>
                        
                        {/* Mobile: Show amount and dates prominently */}
                        <div className="lg:hidden bg-muted/30 p-3 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-lg">₹{(invoice.total_amount || 0).toLocaleString()}</span>
                            <Badge variant={getStatusColor(invoice.status)} className="text-xs">
                              {invoice.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Issue: {new Date(invoice.issue_date).toLocaleDateString()}</p>
                            {invoice.due_date && (
                              <p className={isOverdue(invoice.due_date, invoice.status) ? "text-red-600" : ""}>
                                Due: {new Date(invoice.due_date).toLocaleDateString()}
                                {isOverdue(invoice.due_date, invoice.status) && " (Overdue)"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Desktop: Amount and dates */}
                      <div className="hidden lg:flex lg:flex-col lg:items-end lg:text-right lg:min-w-fit lg:ml-4">
                        <p className="font-bold text-xl">₹{(invoice.total_amount || 0).toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          Issue: {new Date(invoice.issue_date).toLocaleDateString()}
                        </p>
                        {invoice.due_date && (
                          <p className={`text-sm ${isOverdue(invoice.due_date, invoice.status) ? "text-red-600" : "text-muted-foreground"}`}>
                            Due: {new Date(invoice.due_date).toLocaleDateString()}
                            {isOverdue(invoice.due_date, invoice.status) && " (Overdue)"}
                          </p>
                        )}
                        <Badge variant={getStatusColor(invoice.status)} className="mt-2">
                          {invoice.status}
                        </Badge>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2 lg:flex-row lg:space-y-0 lg:space-x-2 lg:ml-4">
                        <div className="grid grid-cols-2 gap-2 lg:flex lg:gap-1">
                          <Button variant="outline" size="sm" onClick={() => handleEditInvoice(invoice)} className="h-9">
                            <Edit className="h-4 w-4 mr-2 lg:mr-0" />
                            <span className="lg:hidden">Edit</span>
                          </Button>
                          <Button variant="outline" size="sm" className="h-9">
                            <Eye className="h-4 w-4 mr-2 lg:mr-0" />
                            <span className="lg:hidden">View</span>
                          </Button>
                          <Button variant="outline" size="sm" className="h-9">
                            <Download className="h-4 w-4 mr-2 lg:mr-0" />
                            <span className="lg:hidden">Download</span>
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteInvoice(invoice)} className="h-9">
                            <Trash2 className="h-4 w-4 mr-2 lg:mr-0" />
                            <span className="lg:hidden">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <InvoiceFormDialog
        isOpen={invoiceFormOpen}
        onClose={() => setInvoiceFormOpen(false)}
        invoice={selectedInvoice}
        onInvoiceSaved={handleInvoiceSaved}
      />

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onDeleted={handleInvoiceDeleted}
        itemType="Invoice"
        itemName={invoiceToDelete?.invoice_number || ''}
        itemId={invoiceToDelete?.id || ''}
        tableName="invoices"
      />
    </div>
  );
};

export default Invoices;