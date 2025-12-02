import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, FileCheck, Send, DollarSign, Calendar, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/database';
import QuotationFormDialog from '@/components/QuotationFormDialog';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';

const Quotations = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quotationFormOpen, setQuotationFormOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<any>(null);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotations(data || []);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch quotations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewQuotation = () => {
    setSelectedQuotation(null);
    setQuotationFormOpen(true);
  };

  const handleEditQuotation = (quotation: any) => {
    setSelectedQuotation(quotation);
    setQuotationFormOpen(true);
  };

  const handleDeleteQuotation = (quotation: any) => {
    setQuotationToDelete(quotation);
    setDeleteDialogOpen(true);
  };

  const handleQuotationSaved = () => {
    fetchQuotations();
  };

  const handleQuotationDeleted = () => {
    fetchQuotations();
  };

  // Calculate stats from real data
  const quotationStats = {
    totalQuotations: quotations.length,
    pending: quotations.filter(q => q.status === 'sent').length,
    accepted: quotations.filter(q => q.status === 'accepted').length,
    totalValue: quotations.reduce((sum, q) => sum + (q.total_amount || 0), 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredQuotations = quotations.filter(quote => 
    quote.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.quote_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.client_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const templates = [
    {
      id: '1',
      name: 'Standard Construction Quote',
      description: 'General construction work quotation template',
      lastUsed: '2024-01-15',
    },
    {
      id: '2',
      name: 'Renovation Estimate',
      description: 'Template for renovation and refurbishment projects',
      lastUsed: '2024-01-12',
    },
    {
      id: '3',
      name: 'Consulting Services',
      description: 'Professional consulting services quotation',
      lastUsed: '2024-01-08',
    },
  ];

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Quotations</h1>
          <p className="text-sm lg:text-base text-muted-foreground">Manage quotes and estimates for potential clients</p>
        </div>
        <Button onClick={handleNewQuotation} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Quotation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileCheck className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Quotes</p>
                <p className="text-2xl font-bold">{quotationStats.totalQuotations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Send className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{quotationStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Accepted</p>
                <p className="text-2xl font-bold">{quotationStats.accepted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">₹{quotationStats.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col space-y-2 sm:flex-row sm:gap-4 sm:space-y-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotations by title, number, or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Quotations Content */}
      <Tabs defaultValue="quotations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quotations">Quotations</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="quotations" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading quotations...</div>
          ) : (
            <div className="grid gap-4">
              {filteredQuotations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No quotations found. Create your first quotation to get started.
                </div>
              ) : (
                filteredQuotations.map((quote) => (
                  <Card key={quote.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{quote.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {quote.quote_number} • {quote.client_id || 'No client'}
                          </p>
                        </div>
                        <Badge className={getStatusColor(quote.status)}>
                          {quote.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Amount</p>
                          <p className="font-semibold">₹{(quote.total_amount || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Subtotal</p>
                          <p className="font-semibold">₹{(quote.subtotal || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Valid Until</p>
                          <p className="font-semibold">
                            {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'Not set'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Created</p>
                          <p className="font-semibold">{new Date(quote.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                        <div className="flex flex-col space-y-2 sm:flex-row sm:gap-2 sm:space-y-0">
                          <Button variant="outline" size="sm" onClick={() => handleEditQuotation(quote)} className="w-full sm:w-auto">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          {quote.status === 'draft' && (
                            <Button size="sm" className="w-full sm:w-auto">Send Quote</Button>
                          )}
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">Download PDF</Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteQuotation(quote)} className="w-full sm:w-auto">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Quotation Templates</h3>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
          
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Last used: {new Date(template.lastUsed).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button size="sm">Use Template</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <QuotationFormDialog
        isOpen={quotationFormOpen}
        onClose={() => setQuotationFormOpen(false)}
        quotation={selectedQuotation}
        onQuotationSaved={handleQuotationSaved}
      />

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onDeleted={handleQuotationDeleted}
        itemType="Quotation"
        itemName={quotationToDelete?.title || ''}
        itemId={quotationToDelete?.id || ''}
        tableName="quotations"
      />
    </div>
  );
};

export default Quotations;