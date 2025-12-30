/**
 * Agency Data Viewer
 * Read-only access to agency data for super admin
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, Eye, Users, Handshake, Briefcase, FileText, DollarSign, Package, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AgencyDataViewerProps {
  agencyId?: string;
}

const AgencyDataViewer = ({ agencyId: propAgencyId }: AgencyDataViewerProps) => {
  const { agencyId: paramAgencyId } = useParams<{ agencyId: string }>();
  const agencyId = propAgencyId || paramAgencyId;
  const navigate = useNavigate();
  const { user, userRole, isSystemSuperAdmin } = useAuth();
  const { toast } = useToast();
  
  const [selectedAgency, setSelectedAgency] = useState<string>(agencyId || '');
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({
    users: [],
    clients: [],
    projects: [],
    invoices: [],
    inventory: [],
  });

  // Redirect if not system super admin
  if (!isSystemSuperAdmin && userRole !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    fetchAgencies();
    if (agencyId) {
      setSelectedAgency(agencyId);
      fetchAgencyData(agencyId);
    }
  }, [agencyId]);

  const fetchAgencies = async () => {
    try {
      const response = await fetch('/api/system/agencies', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (response.ok) {
        const result = await response.json();
        setAgencies(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching agencies:', error);
    }
  };

  const fetchAgencyData = async (id: string) => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/super-admin/agencies/${id}/data`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data || {});
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load agency data',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load agency data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAgencyChange = (value: string) => {
    setSelectedAgency(value);
    if (value) {
      fetchAgencyData(value);
      navigate(`/super-admin/agencies/${value}/data`);
    }
  };

  const handleExport = (type: string) => {
    toast({
      title: 'Export',
      description: `Exporting ${type} data...`,
    });
    // TODO: Implement export functionality
  };

  if (!selectedAgency) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/super-admin/agencies')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Agencies
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Select Agency</CardTitle>
              <CardDescription>Choose an agency to view its data</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedAgency} onValueChange={handleAgencyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an agency" />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  const selectedAgencyData = agencies.find(a => a.id === selectedAgency);

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/super-admin/agencies')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Agencies
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Agency Data Viewer</h1>
              <p className="text-muted-foreground mt-1">
                Read-only access to {selectedAgencyData?.name || 'agency'} data
              </p>
            </div>
          </div>
          <Select value={selectedAgency} onValueChange={handleAgencyChange}>
            <SelectTrigger className="w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {agencies.map((agency) => (
                <SelectItem key={agency.id} value={agency.id}>
                  {agency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data Tabs */}
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users">
                <Users className="mr-2 h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="clients">
                <Handshake className="mr-2 h-4 w-4" />
                Clients
              </TabsTrigger>
              <TabsTrigger value="projects">
                <Briefcase className="mr-2 h-4 w-4" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="invoices">
                <FileText className="mr-2 h-4 w-4" />
                Invoices
              </TabsTrigger>
              <TabsTrigger value="inventory">
                <Package className="mr-2 h-4 w-4" />
                Inventory
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Users & Employees</CardTitle>
                      <CardDescription>View all users in this agency</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleExport('users')}>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.users.map((user: any) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.full_name || 'N/A'}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{user.role || 'employee'}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.is_active ? 'default' : 'secondary'}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clients" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Clients</CardTitle>
                      <CardDescription>View all clients in this agency</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleExport('clients')}>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.clients.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No clients found
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.clients.map((client: any) => (
                          <TableRow key={client.id}>
                            <TableCell>{client.name || 'N/A'}</TableCell>
                            <TableCell>{client.email || 'N/A'}</TableCell>
                            <TableCell>{client.phone || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={client.is_active ? 'default' : 'secondary'}>
                                {client.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Projects</CardTitle>
                      <CardDescription>View all projects in this agency</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleExport('projects')}>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.projects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No projects found
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.projects.map((project: any) => (
                          <TableRow key={project.id}>
                            <TableCell>{project.name || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{project.status || 'active'}</Badge>
                            </TableCell>
                            <TableCell>${project.budget?.toLocaleString() || '0'}</TableCell>
                            <TableCell>{project.progress || 0}%</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Invoices</CardTitle>
                      <CardDescription>View all invoices in this agency</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleExport('invoices')}>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.invoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No invoices found
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.invoices.map((invoice: any) => (
                          <TableRow key={invoice.id}>
                            <TableCell>{invoice.invoice_number || 'N/A'}</TableCell>
                            <TableCell>{invoice.client_name || 'N/A'}</TableCell>
                            <TableCell>${invoice.total_amount?.toLocaleString() || '0'}</TableCell>
                            <TableCell>
                              <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                                {invoice.status || 'pending'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Inventory</CardTitle>
                      <CardDescription>View all inventory items in this agency</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleExport('inventory')}>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.inventory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No inventory items found
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.inventory.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.name || 'N/A'}</TableCell>
                            <TableCell>{item.sku || 'N/A'}</TableCell>
                            <TableCell>{item.quantity || 0}</TableCell>
                            <TableCell>${item.value?.toLocaleString() || '0'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PageContainer>
  );
};

export default AgencyDataViewer;

