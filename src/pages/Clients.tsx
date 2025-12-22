import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, Edit, Trash2, Mail, Phone, MapPin, Building, Calendar, User, DollarSign, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/database';
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { getAgencyId } from "@/utils/agencyUtils";
import { RoleGuard } from "@/components/RoleGuard";
import { hasRoleOrHigher, AppRole } from "@/utils/roleUtils";
import { useNavigate } from "react-router-dom";

const Clients = () => {
  const { toast } = useToast();
  const { user, profile, userRole } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientStats, setClientStats] = useState({
    totalClients: 0,
    activeClients: 0,
    inactiveClients: 0,
    suspendedClients: 0
  });

  const canManageClients = userRole ? hasRoleOrHigher(userRole, 'sales_manager' as AppRole) : false;
  const canDeleteClients = userRole ? hasRoleOrHigher(userRole, 'admin' as AppRole) : false;

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const agencyId = await getAgencyId(profile, user?.id);
      if (!agencyId) {
        toast({
          title: 'Error',
          description: 'Agency context is missing. Please re-login.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const { data, error } = await db
        .from('clients')
        .select('*')
        .eq('agency_id', agencyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setClients(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const active = data?.filter(c => c.status === 'active').length || 0;
      const inactive = data?.filter(c => c.status === 'inactive').length || 0;
      const suspended = data?.filter(c => c.status === 'suspended').length || 0;
      
      setClientStats({
        totalClients: total,
        activeClients: active,
        inactiveClients: inactive,
        suspendedClients: suspended
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch clients',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClient = (client: any) => {
    navigate('/clients/edit/' + client.id, { state: { client } });
  };

  const handleDeleteClient = (client: any) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  const handleClientSaved = () => {
    fetchClients();
    setSelectedClient(null);
  };

  const handleClientDeleted = () => {
    fetchClients();
    setSelectedClient(null);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone?.includes(searchTerm) ||
                         client.contact_person?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = selectedTab === 'all' || client.status === selectedTab;
    
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'suspended': return 'destructive';
      default: return 'secondary';
    }
  };

  const getIndustryColor = (industry: string) => {
    switch (industry?.toLowerCase()) {
      case 'technology': return 'bg-blue-100 text-blue-800';
      case 'healthcare': return 'bg-green-100 text-green-800';
      case 'software': return 'bg-purple-100 text-purple-800';
      case 'marketing': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const ClientCard = ({ client }: { client: any }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Building className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold">{client.name}</h3>
                <span className="text-sm text-muted-foreground">#{client.client_number}</span>
                <Badge variant={getStatusColor(client.status)}>
                  {client.status}
                </Badge>
                {client.industry && (
                  <span className={`text-xs px-2 py-1 rounded-full ${getIndustryColor(client.industry)}`}>
                    {client.industry}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  {client.contact_person && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{client.contact_person}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{client.address}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  {client.company_name && (
                    <div>
                      <p className="text-muted-foreground">Company</p>
                      <p className="font-medium">{client.company_name}</p>
                    </div>
                  )}
                  {client.payment_terms && (
                    <div>
                      <p className="text-muted-foreground">Payment Terms</p>
                      <p className="font-medium">{client.payment_terms} days</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">{new Date(client.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {canManageClients && (
              <Button variant="outline" size="sm" onClick={() => handleEditClient(client)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canDeleteClients && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDeleteClient(client)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/projects?client_id=${client.id}`)}
          >
            View Projects
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/invoices?client_id=${client.id}`)}
          >
            View Invoices
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/quotations?client_id=${client.id}`)}
          >
            View Quotations
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading clients...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage client relationships and project details</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Export List
          </Button>
          {canManageClients && (
            <Button onClick={() => navigate('/clients/create')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{clientStats.totalClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                <p className="text-2xl font-bold">{clientStats.activeClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Inactive Clients</p>
                <p className="text-2xl font-bold">{clientStats.inactiveClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Suspended Clients</p>
                <p className="text-2xl font-bold">{clientStats.suspendedClients}</p>
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
                placeholder="Search clients..." 
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
          <TabsTrigger value="all">All Clients ({clientStats.totalClients})</TabsTrigger>
          <TabsTrigger value="active">Active ({clientStats.activeClients})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({clientStats.inactiveClients})</TabsTrigger>
          <TabsTrigger value="suspended">Suspended ({clientStats.suspendedClients})</TabsTrigger>
        </TabsList>
        
        <TabsContent value={selectedTab} className="mt-6">
          {filteredClients.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Building className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No clients found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first client.'}
                  </p>
                  {canManageClients && (
                    <Button onClick={() => navigate('/clients/create')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Client
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredClients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>


      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedClient(null);
        }}
        onDeleted={handleClientDeleted}
        itemType="Client"
        itemName={selectedClient?.name || ''}
        itemId={selectedClient?.id || ''}
        tableName="clients"
        softDelete={true}
        userId={user?.id}
      />
    </div>
  );
};

export default Clients;