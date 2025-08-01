import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, Edit, Trash2, Mail, Phone, MapPin, Building, Calendar, User, DollarSign, FileText } from "lucide-react";

const Clients = () => {
  // Mock data - replace with actual API calls
  const clientStats = {
    totalClients: 48,
    activeProjects: 15,
    totalRevenue: 485000,
    avgProjectValue: 32333
  };

  const clients = [
    {
      id: "CLT-001",
      name: "ABC Corporation",
      industry: "Technology",
      email: "contact@abccorp.com",
      phone: "+1 (555) 123-4567",
      address: "123 Business Ave, New York, NY 10001",
      status: "active",
      joinDate: "2023-05-15",
      totalProjects: 8,
      activeProjects: 3,
      totalRevenue: 125000,
      lastActivity: "2024-01-25",
      contactPerson: "John Smith"
    },
    {
      id: "CLT-002",
      name: "XYZ Ltd",
      industry: "Healthcare",
      email: "info@xyzltd.com",
      phone: "+1 (555) 234-5678",
      address: "456 Medical Center Dr, Boston, MA 02101",
      status: "active",
      joinDate: "2023-08-20",
      totalProjects: 5,
      activeProjects: 2,
      totalRevenue: 85000,
      lastActivity: "2024-01-23",
      contactPerson: "Sarah Johnson"
    },
    {
      id: "CLT-003",
      name: "Tech Solutions Inc",
      industry: "Software",
      email: "hello@techsolutions.com",
      phone: "+1 (555) 345-6789",
      address: "789 Innovation Blvd, San Francisco, CA 94107",
      status: "inactive",
      joinDate: "2022-12-10",
      totalProjects: 12,
      activeProjects: 0,
      totalRevenue: 215000,
      lastActivity: "2023-11-15",
      contactPerson: "Mike Davis"
    },
    {
      id: "CLT-004",
      name: "Digital Media Co",
      industry: "Marketing",
      email: "contact@digitalmedia.co",
      phone: "+1 (555) 456-7890",
      address: "321 Creative St, Los Angeles, CA 90210",
      status: "active",
      joinDate: "2024-01-05",
      totalProjects: 2,
      activeProjects: 2,
      totalRevenue: 35000,
      lastActivity: "2024-01-24",
      contactPerson: "Emily Wilson"
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'suspended': return 'destructive';
      default: return 'secondary';
    }
  };

  const getIndustryColor = (industry: string) => {
    switch (industry.toLowerCase()) {
      case 'technology': return 'bg-blue-100 text-blue-800';
      case 'healthcare': return 'bg-green-100 text-green-800';
      case 'software': return 'bg-purple-100 text-purple-800';
      case 'marketing': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage client relationships and project details</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Export List
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
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
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">{clientStats.activeProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{clientStats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg Project Value</p>
                <p className="text-2xl font-bold">₹{clientStats.avgProjectValue.toLocaleString()}</p>
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
              <Input placeholder="Search clients..." className="pl-10" />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Clients</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="grid gap-4">
            {clients.map((client) => (
              <Card key={client.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{client.name}</h3>
                          <Badge variant={getStatusColor(client.status)}>
                            {client.status}
                          </Badge>
                          <span className={`text-xs px-2 py-1 rounded-full ${getIndustryColor(client.industry)}`}>
                            {client.industry}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{client.contactPerson}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span>{client.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{client.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{client.address}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <p className="text-muted-foreground">Projects</p>
                              <p className="font-medium">{client.activeProjects} active / {client.totalProjects} total</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Revenue</p>
                              <p className="font-medium">₹{client.totalRevenue.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Joined</p>
                              <p className="font-medium">{new Date(client.joinDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Last Activity</p>
                              <p className="font-medium">{new Date(client.lastActivity).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="active" className="mt-6">
          <div className="grid gap-4">
            {clients.filter(c => c.status === 'active').map((client) => (
              <Card key={client.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{client.name}</h3>
                          <Badge variant={getStatusColor(client.status)}>
                            {client.status}
                          </Badge>
                          <span className={`text-xs px-2 py-1 rounded-full ${getIndustryColor(client.industry)}`}>
                            {client.industry}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{client.contactPerson}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span>{client.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{client.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{client.address}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <p className="text-muted-foreground">Projects</p>
                              <p className="font-medium">{client.activeProjects} active / {client.totalProjects} total</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Revenue</p>
                              <p className="font-medium">₹{client.totalRevenue.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Joined</p>
                              <p className="font-medium">{new Date(client.joinDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Last Activity</p>
                              <p className="font-medium">{new Date(client.lastActivity).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="inactive" className="mt-6">
          <div className="grid gap-4">
            {clients.filter(c => c.status === 'inactive').map((client) => (
              <Card key={client.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{client.name}</h3>
                          <Badge variant={getStatusColor(client.status)}>
                            {client.status}
                          </Badge>
                          <span className={`text-xs px-2 py-1 rounded-full ${getIndustryColor(client.industry)}`}>
                            {client.industry}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{client.contactPerson}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span>{client.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{client.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{client.address}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <p className="text-muted-foreground">Projects</p>
                              <p className="font-medium">{client.activeProjects} active / {client.totalProjects} total</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Revenue</p>
                              <p className="font-medium">₹{client.totalRevenue.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Joined</p>
                              <p className="font-medium">{new Date(client.joinDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Last Activity</p>
                              <p className="font-medium">{new Date(client.lastActivity).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

export default Clients;