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
              <Input 
                placeholder="Search invoices..." 
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
                <div key={invoice.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 border rounded-lg space-y-4 lg:space-y-0">
                  <div className="flex-1">
                    <div className="flex flex-col space-y-2">
                      <div>
                        <h3 className="font-semibold">{invoice.invoice_number}</h3>
                        <p className="text-sm text-muted-foreground">{invoice.title}</p>
                        <p className="text-xs text-muted-foreground">{invoice.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 lg:text-right space-y-3 sm:space-y-0">
                    <div className="text-center sm:text-right">
                      <p className="font-bold text-lg">₹{(invoice.total_amount || 0).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        Issue: {new Date(invoice.issue_date).toLocaleDateString()}
                      </p>
                      {invoice.due_date && (
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(invoice.due_date).toLocaleDateString()}
                        </p>
                      )}
                      {invoice.due_date && isOverdue(invoice.due_date, invoice.status) && (
                        <p className="text-xs text-red-600">Overdue</p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 space-y-2 sm:space-y-0">
                      <Badge variant={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleEditInvoice(invoice)} className="flex-1 sm:flex-none">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteInvoice(invoice)} className="flex-1 sm:flex-none">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
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