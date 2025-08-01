import React, { useState } from 'react';
import { Plus, Search, Filter, FileCheck, Send, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Quotations = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  const quotationStats = {
    totalQuotations: 87,
    pending: 23,
    accepted: 45,
    totalValue: 5200000,
  };

  const quotations = [
    {
      id: '1',
      quoteNumber: 'Q-2024-001',
      title: 'Office Building Construction Quote',
      client: 'ABC Corp',
      status: 'sent',
      totalAmount: 500000,
      validUntil: '2024-02-15',
      createdDate: '2024-01-15',
      items: 5,
    },
    {
      id: '2',
      quoteNumber: 'Q-2024-002',
      title: 'Warehouse Renovation Estimate',
      client: 'XYZ Industries',
      status: 'draft',
      totalAmount: 300000,
      validUntil: '2024-02-20',
      createdDate: '2024-01-18',
      items: 3,
    },
    {
      id: '3',
      quoteNumber: 'Q-2024-003',
      title: 'Residential Complex Quote',
      client: 'Housing Ltd',
      status: 'accepted',
      totalAmount: 800000,
      validUntil: '2024-01-30',
      createdDate: '2024-01-05',
      items: 8,
    },
    {
      id: '4',
      quoteNumber: 'Q-2024-004',
      title: 'Commercial Fit-out',
      client: 'Retail Corp',
      status: 'rejected',
      totalAmount: 150000,
      validUntil: '2024-01-25',
      createdDate: '2024-01-10',
      items: 4,
    },
  ];

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
    quote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.client.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quotations</h1>
          <p className="text-muted-foreground">Manage quotes and estimates for potential clients</p>
        </div>
        <Button>
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
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotations by title, number, or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
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
          <div className="grid gap-4">
            {filteredQuotations.map((quote) => (
              <Card key={quote.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{quote.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {quote.quoteNumber} • {quote.client}
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
                      <p className="font-semibold">₹{quote.totalAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Items</p>
                      <p className="font-semibold">{quote.items}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valid Until</p>
                      <p className="font-semibold">{new Date(quote.validUntil).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-semibold">{new Date(quote.createdDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      {quote.status === 'draft' && (
                        <Button size="sm">Send Quote</Button>
                      )}
                      <Button variant="outline" size="sm">Download PDF</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
    </div>
  );
};

export default Quotations;