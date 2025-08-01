import React, { useState } from 'react';
import { Plus, Search, Filter, Users2, Phone, Mail, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

const CRM = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  const crmStats = {
    totalLeads: 156,
    activeLeads: 89,
    conversionRate: 18.5,
    pipelineValue: 3500000,
  };

  const leads = [
    {
      id: '1',
      leadNumber: 'L-2024-001',
      company: 'Tech Solutions Inc',
      contactName: 'John Doe',
      email: 'john@techsolutions.com',
      phone: '+91 98765 43210',
      status: 'qualified',
      priority: 'high',
      estimatedValue: 500000,
      probability: 75,
      expectedCloseDate: '2024-02-28',
      source: 'Website',
      assignedTo: 'Sarah Manager',
    },
    {
      id: '2',
      leadNumber: 'L-2024-002',
      company: 'Industrial Corp',
      contactName: 'Jane Smith',
      email: 'jane@industrial.com',
      phone: '+91 87654 32109',
      status: 'proposal',
      priority: 'medium',
      estimatedValue: 300000,
      probability: 50,
      expectedCloseDate: '2024-03-15',
      source: 'Referral',
      assignedTo: 'Mike Sales',
    },
    {
      id: '3',
      leadNumber: 'L-2024-003',
      company: 'Retail Ventures',
      contactName: 'Bob Johnson',
      email: 'bob@retail.com',
      phone: '+91 76543 21098',
      status: 'new',
      priority: 'low',
      estimatedValue: 150000,
      probability: 25,
      expectedCloseDate: '2024-04-01',
      source: 'Cold Call',
      assignedTo: 'Alex Rep',
    },
  ];

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
    lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.leadNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CRM</h1>
          <p className="text-muted-foreground">Manage customer relationships and sales pipeline</p>
        </div>
        <Button>
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
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads by company, contact, or lead number..."
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

      {/* CRM Content */}
      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        </TabsList>
        
        <TabsContent value="leads" className="space-y-4">
          <div className="grid gap-4">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{lead.company}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {lead.leadNumber} • {lead.contactName}
                      </p>
                    </div>
                    <div className="flex gap-2">
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
                      <p className="font-medium">{lead.email}</p>
                      <p className="text-sm">{lead.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Value</p>
                      <p className="font-semibold">₹{lead.estimatedValue.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Close: {new Date(lead.expectedCloseDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Probability</p>
                      <div className="flex items-center gap-2">
                        <Progress value={lead.probability} className="flex-1" />
                        <span className="text-sm font-medium">{lead.probability}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Source: {lead.source} • Assigned to: {lead.assignedTo}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">View Details</Button>
                      <Button variant="outline" size="sm">Add Activity</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
    </div>
  );
};

export default CRM;