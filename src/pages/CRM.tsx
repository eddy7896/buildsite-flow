import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Users2, Phone, Mail, Target, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/database';
import LeadFormDialog from '@/components/LeadFormDialog';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';

const CRM = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadFormOpen, setLeadFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<any>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await db
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch leads',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewLead = () => {
    setSelectedLead(null);
    setLeadFormOpen(true);
  };

  const handleEditLead = (lead: any) => {
    setSelectedLead(lead);
    setLeadFormOpen(true);
  };

  const handleDeleteLead = (lead: any) => {
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  const handleLeadSaved = () => {
    fetchLeads();
  };

  const handleLeadDeleted = () => {
    fetchLeads();
  };

  // Calculate stats from real data
  const crmStats = {
    totalLeads: leads.length,
    activeLeads: leads.filter(lead => ['new', 'contacted', 'qualified', 'proposal', 'negotiation'].includes(lead.status)).length,
    conversionRate: leads.length > 0 ? ((leads.filter(lead => lead.status === 'won').length / leads.length) * 100).toFixed(1) : 0,
    pipelineValue: leads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0),
  };

  const activities = [
    {
      id: '1',
      type: 'call',
      subject: 'Follow-up call with Tech Solutions',
      leadCompany: 'Tech Solutions Inc',
      status: 'pending',
      dueDate: '2024-01-25',
      assignedTo: 'Sarah Manager',
    },
    {
      id: '2',
      type: 'meeting',
      subject: 'Proposal presentation',
      leadCompany: 'Industrial Corp',
      status: 'completed',
      dueDate: '2024-01-22',
      assignedTo: 'Mike Sales',
    },
    {
      id: '3',
      type: 'email',
      subject: 'Send project details',
      leadCompany: 'Retail Ventures',
      status: 'pending',
      dueDate: '2024-01-26',
      assignedTo: 'Alex Rep',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'proposal': return 'bg-purple-100 text-purple-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'won': return 'bg-emerald-100 text-emerald-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return Phone;
      case 'email': return Mail;
      case 'meeting': return Users2;
      default: return Target;
    }
  };

  const filteredLeads = leads.filter(lead => 
    lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.lead_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">CRM</h1>
          <p className="text-sm lg:text-base text-muted-foreground">Manage customer relationships and sales pipeline</p>
        </div>
        <Button onClick={handleNewLead} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users2 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{crmStats.totalLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Leads</p>
                <p className="text-2xl font-bold">{crmStats.activeLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{crmStats.conversionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold">₹{crmStats.pipelineValue.toLocaleString()}</p>
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
            placeholder="Search leads by company, contact, or lead number..."
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

      {/* CRM Content */}
      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        </TabsList>
        
        <TabsContent value="leads" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading leads...</div>
          ) : (
            <div className="grid gap-4">
              {filteredLeads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No leads found. Create your first lead to get started.
                </div>
              ) : (
                filteredLeads.map((lead) => (
                  <Card key={lead.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{lead.company_name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {lead.lead_number} • {lead.contact_name}
                          </p>
                        </div>
                        <div className="flex gap-2 self-start">
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                          <Badge className={getPriorityColor(lead.priority)}>
                            {lead.priority}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Contact</p>
                          <p className="font-medium">{lead.email || 'No email'}</p>
                          <p className="text-sm">{lead.phone || 'No phone'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Estimated Value</p>
                          <p className="font-semibold">₹{(lead.estimated_value || 0).toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            Close: {lead.expected_close_date ? new Date(lead.expected_close_date).toLocaleDateString() : 'Not set'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Probability</p>
                          <div className="flex items-center gap-2">
                            <Progress value={lead.probability || 0} className="flex-1" />
                            <span className="text-sm font-medium">{lead.probability || 0}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                        <div className="text-sm text-muted-foreground">
                          Created: {new Date(lead.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex flex-col space-y-2 sm:flex-row sm:gap-2 sm:space-y-0">
                          <Button variant="outline" size="sm" onClick={() => handleEditLead(lead)} className="w-full sm:w-auto">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">Add Activity</Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteLead(lead)} className="w-full sm:w-auto">
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
        
        <TabsContent value="activities" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Upcoming Activities</h3>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              New Activity
            </Button>
          </div>
          
          <div className="grid gap-4">
            {activities.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.type);
              return (
                <Card key={activity.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <ActivityIcon className="h-8 w-8 text-blue-600" />
                      <div className="flex-1">
                        <h4 className="font-semibold">{activity.subject}</h4>
                        <p className="text-sm text-muted-foreground">{activity.leadCompany}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{new Date(activity.dueDate).toLocaleDateString()}</p>
                        <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="pipeline">
          <Card>
            <CardHeader>
              <CardTitle>Sales Pipeline</CardTitle>
              <p className="text-muted-foreground">Visual representation of leads through the sales process</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">Sales pipeline visualization will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <LeadFormDialog
        isOpen={leadFormOpen}
        onClose={() => setLeadFormOpen(false)}
        lead={selectedLead}
        onLeadSaved={handleLeadSaved}
      />

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onDeleted={handleLeadDeleted}
        itemType="Lead"
        itemName={leadToDelete?.company_name || ''}
        itemId={leadToDelete?.id || ''}
        tableName="leads"
      />
    </div>
  );
};

export default CRM;