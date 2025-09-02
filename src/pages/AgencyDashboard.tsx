import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Users, Settings, UserPlus, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import UserFormDialog from '@/components/UserFormDialog';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';

interface AgencyData {
  id: string;
  name: string;
  domain: string;
  subscription_plan: string;
  max_users: number;
  is_active: boolean;
  created_at: string;
}

interface AgencySettings {
  agency_name: string;
  logo_url: string;
  domain: string;
  default_currency: string;
}

interface AgencyUser {
  id: string;
  user_id: string;
  full_name: string;
  department: string;
  position: string;
  role: string;
  is_active: boolean;
  hire_date: string;
  created_at: string;
}

const AgencyDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [agencyData, setAgencyData] = useState<AgencyData | null>(null);
  const [agencySettings, setAgencySettings] = useState<AgencySettings>({
    agency_name: '',
    logo_url: '',
    domain: '',
    default_currency: 'USD'
  });
  const [users, setUsers] = useState<AgencyUser[]>([]);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<AgencyUser | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AgencyUser | null>(null);

  useEffect(() => {
    if (user) {
      fetchAgencyData();
      fetchAgencyUsers();
    }
  }, [user]);

  const fetchAgencyData = async () => {
    try {
      // Get agency info
      const { data: agencyData, error: agencyError } = await supabase
        .from('agencies')
        .select('*')
        .single();

      if (agencyError) throw agencyError;

      setAgencyData(agencyData);

      // Get agency settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('agency_settings')
        .select('*')
        .eq('agency_id', agencyData.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      if (settingsData) {
        setAgencySettings({
          agency_name: settingsData.agency_name || '',
          logo_url: settingsData.logo_url || '',
          domain: settingsData.domain || '',
          default_currency: settingsData.default_currency || 'USD'
        });
      }
    } catch (error: any) {
      toast({
        title: "Error loading agency data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAgencyUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!inner(role)
        `);

      if (error) throw error;

      const formattedUsers = data.map((profile: any) => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name || '',
        department: profile.department || '',
        position: profile.position || '',
        role: profile.user_roles[0]?.role || 'employee',
        is_active: profile.is_active,
        hire_date: profile.hire_date || '',
        created_at: profile.created_at
      }));

      setUsers(formattedUsers);
    } catch (error: any) {
      toast({
        title: "Error loading users",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateAgencySettings = async () => {
    if (!agencyData) return;

    try {
      const { error } = await supabase
        .from('agency_settings')
        .upsert({
          agency_id: agencyData.id,
          agency_name: agencySettings.agency_name,
          logo_url: agencySettings.logo_url,
          domain: agencySettings.domain,
          default_currency: agencySettings.default_currency
        });

      if (error) throw error;

      toast({
        title: "Settings updated",
        description: "Agency settings have been updated successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error updating settings",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Deactivate user instead of deleting
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('user_id', userToDelete.user_id);

      if (error) throw error;

      toast({
        title: "User deactivated",
        description: "User has been deactivated successfully."
      });

      fetchAgencyUsers();
      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error deactivating user",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeUsers = users.filter(user => user.is_active).length;
  const totalUsers = users.length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agency Dashboard</h1>
          <p className="text-muted-foreground">Manage your agency settings and users</p>
        </div>
        <Badge variant={agencyData?.is_active ? "default" : "secondary"}>
          {agencyData?.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {totalUsers - activeUsers} inactive
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{agencyData?.subscription_plan}</div>
            <p className="text-xs text-muted-foreground">
              {agencyData?.max_users} user limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Domain</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agencyData?.domain || 'Not set'}</div>
            <p className="text-xs text-muted-foreground">
              Agency domain
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Users</h2>
            <Button onClick={() => setShowUserDialog(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>{user.position}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.hire_date ? new Date(user.hire_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingUser(user);
                                setShowUserDialog(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {user.is_active && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setUserToDelete(user);
                                  setShowDeleteDialog(true);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agency Settings</CardTitle>
              <CardDescription>
                Manage your agency's basic information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agency_name">Agency Name</Label>
                  <Input
                    id="agency_name"
                    value={agencySettings.agency_name}
                    onChange={(e) => setAgencySettings(prev => ({ ...prev, agency_name: e.target.value }))}
                    placeholder="Enter agency name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={agencySettings.domain}
                    onChange={(e) => setAgencySettings(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={agencySettings.logo_url}
                    onChange={(e) => setAgencySettings(prev => ({ ...prev, logo_url: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_currency">Default Currency</Label>
                  <Select
                    value={agencySettings.default_currency}
                    onValueChange={(value) => setAgencySettings(prev => ({ ...prev, default_currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={updateAgencySettings} className="w-full md:w-auto">
                Update Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UserFormDialog
        isOpen={showUserDialog}
        onClose={() => {
          setShowUserDialog(false);
          setEditingUser(null);
        }}
        onUserSaved={fetchAgencyUsers}
        user={editingUser ? {
          id: editingUser.user_id,
          name: editingUser.full_name,
          email: '', // Not available in AgencyUser
          role: editingUser.role,
          position: editingUser.position,
          department: editingUser.department,
          phone: '', // Not available in AgencyUser
          hire_date: editingUser.hire_date
        } : null}
      />

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onDeleted={handleDeleteUser}
        itemType="User"
        itemName={userToDelete?.full_name || ''}
        itemId={userToDelete?.user_id || ''}
        tableName="profiles"
      />
    </div>
  );
};

export default AgencyDashboard;