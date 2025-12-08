import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, Download, CreditCard, DollarSign, TrendingUp, Calendar, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from '@/lib/database';
import { useToast } from "@/hooks/use-toast";

interface Payment {
  id: string;
  invoiceId: string;
  client: string;
  amount: number;
  paymentDate: string;
  method: string;
  status: string;
  reference: string;
}

interface PaymentStats {
  totalReceived: number;
  pendingPayments: number;
  thisMonth: number;
  avgPaymentTime: number;
}

const Payments = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState('all');
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    totalReceived: 0,
    pendingPayments: 0,
    thisMonth: 0,
    avgPaymentTime: 0
  });
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);

      // Fetch invoices - payments are tracked through invoice status
      const { data: invoices, error: invoicesError } = await db
        .from('invoices')
        .select('*')
        .order('issue_date', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Fetch clients for names
      const clientIds = (invoices || []).map(i => i.client_id).filter(Boolean);
      let clients: any[] = [];

      if (clientIds.length > 0) {
        const { data: clientsData, error: clientsError } = await db
          .from('clients')
          .select('id, name, company_name')
          .in('id', clientIds);

        if (clientsError) throw clientsError;
        clients = clientsData || [];
      }

      const clientMap = new Map(clients.map((c: any) => [c.id, c.company_name || c.name]));

      // Also check journal entries for payment transactions
      const { data: journalEntries, error: journalError } = await db
        .from('journal_entries')
        .select('*')
        .order('entry_date', { ascending: false })
        .limit(100);

      if (journalError) throw journalError;

      // Transform invoices to payments
      const transformedPayments: Payment[] = (invoices || []).map((invoice: any) => {
        const clientName = clientMap.get(invoice.client_id) || 'Unknown Client';
        
        // Determine payment status from invoice status
        let paymentStatus = 'pending';
        let paymentMethod = 'Bank Transfer';
        
        if (invoice.status === 'paid' || invoice.status === 'completed') {
          paymentStatus = 'completed';
        } else if (invoice.status === 'overdue') {
          paymentStatus = 'pending';
        } else if (invoice.status === 'cancelled') {
          paymentStatus = 'failed';
        }

        // Use issue_date as payment date for paid invoices, due_date for pending
        const paymentDate = paymentStatus === 'completed' 
          ? invoice.issue_date 
          : invoice.due_date || invoice.issue_date;

        return {
          id: invoice.id.substring(0, 8).toUpperCase(),
          invoiceId: invoice.invoice_number || invoice.id.substring(0, 8).toUpperCase(),
          client: clientName,
          amount: Number(invoice.total_amount || invoice.subtotal || 0),
          paymentDate: paymentDate.split('T')[0],
          method: paymentMethod,
          status: paymentStatus,
          reference: invoice.invoice_number || `INV-${invoice.id.substring(0, 6)}`
        };
      });

      setPayments(transformedPayments);

      // Calculate stats
      const completedPayments = transformedPayments.filter(p => p.status === 'completed');
      const totalReceived = completedPayments.reduce((sum, p) => sum + p.amount, 0);
      const pendingPayments = transformedPayments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const thisMonth = completedPayments.filter(p => {
        const paymentDate = new Date(p.paymentDate);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      }).reduce((sum, p) => sum + p.amount, 0);

      // Calculate average payment time (days between issue and payment for completed)
      let totalDays = 0;
      let count = 0;
      completedPayments.forEach(payment => {
        const invoice = invoices?.find((i: any) => 
          i.invoice_number === payment.invoiceId || 
          i.id.substring(0, 8).toUpperCase() === payment.id
        );
        if (invoice) {
          const issueDate = new Date(invoice.issue_date);
          const payDate = new Date(payment.paymentDate);
          const days = Math.ceil((payDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
          if (days > 0) {
            totalDays += days;
            count++;
          }
        }
      });
      const avgPaymentTime = count > 0 ? Math.round(totalDays / count) : 0;

      setPaymentStats({
        totalReceived: Math.round(totalReceived),
        pendingPayments: Math.round(pendingPayments),
        thisMonth: Math.round(thisMonth),
        avgPaymentTime
      });

    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Error",
        description: "Failed to load payments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment =>
    payment.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFilteredByStatus = (status: string) => {
    if (status === 'all') return filteredPayments;
    return filteredPayments.filter(p => p.status === status);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading payments...</span>
        </div>
      </div>
    );
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      case 'refunded': return 'outline';
      default: return 'secondary';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'credit card':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Track and manage incoming payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Received</p>
                <p className="text-2xl font-bold">₹{paymentStats.totalReceived.toLocaleString()}</p>
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
                <p className="text-2xl font-bold">₹{paymentStats.pendingPayments.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">₹{paymentStats.thisMonth.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg. Payment Time</p>
                <p className="text-2xl font-bold">{paymentStats.avgPaymentTime} days</p>
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
                placeholder="Search payments..." 
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

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({payments.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({payments.filter(p => p.status === 'completed').length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({payments.filter(p => p.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({payments.filter(p => p.status === 'failed').length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value={selectedTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Complete list of all payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFilteredByStatus(selectedTab).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchTerm 
                        ? 'No payments found matching your search.' 
                        : `No ${selectedTab === 'all' ? '' : selectedTab} payments found.`}
                    </p>
                  </div>
                ) : (
                  getFilteredByStatus(selectedTab).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        {getMethodIcon(payment.method)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{payment.client}</h3>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                          <span>Invoice: {payment.invoiceId}</span>
                          <span>•</span>
                          <span>Ref: {payment.reference}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{payment.method}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">₹{payment.amount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Payments;