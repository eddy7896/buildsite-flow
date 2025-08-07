import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, Loader2, Search, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import UserFormDialog from "@/components/UserFormDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'hr' | 'finance_manager' | 'employee';
  status: string;
  userId: string;
  position?: string;
  department?: string;
  phone?: string;
  hire_date?: string;
  avatar_url?: string;
}

const Users = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch profiles and user roles separately
      const [profilesResponse, rolesResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('user_roles')
          .select('user_id, role')
      ]);

      if (profilesResponse.error) throw profilesResponse.error;
      if (rolesResponse.error) throw rolesResponse.error;

      // Create a map of user roles for easy lookup
      const roleMap = new Map();
      rolesResponse.data?.forEach(userRole => {
        roleMap.set(userRole.user_id, userRole.role);
      });

      // Get auth users to get actual email addresses - try but fallback gracefully
      const emailMap = new Map<string, string>();
      try {
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        authUsers?.users?.forEach((authUser: any) => {
          if (authUser?.id && authUser?.email) {
            emailMap.set(authUser.id, authUser.email);
          }
        });
      } catch (authError) {
        console.warn('Could not fetch auth users for emails:', authError);
      }

      const formattedUsers: User[] = profilesResponse.data?.map(profile => ({
        id: profile.user_id,
        name: profile.full_name || 'Unknown User',
        email: emailMap.get(profile.user_id) || 'No email available',
        role: (roleMap.get(profile.user_id) || 'employee') as 'admin' | 'hr' | 'finance_manager' | 'employee',
        status: profile.is_active ? 'active' : 'inactive',
        userId: profile.user_id,
        position: profile.position,
        department: profile.department,
        phone: profile.phone,
        hire_date: profile.hire_date,
        avatar_url: profile.avatar_url
      })) || [];

      setUsers(formattedUsers);
    } catch (err: any) {
      console.error('Fetch users error:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewUser = () => {
    setSelectedUser(null);
    setUserFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setUserFormOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleUserSaved = () => {
    fetchUsers();
  };

  const handleUserDeleted = () => {
    fetchUsers();
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive mb-2">Error loading users</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={fetchUsers} className="mt-4">Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Users</h1>
          <p className="text-sm lg:text-base text-muted-foreground">Manage system users and their roles</p>
        </div>
        <Button onClick={handleNewUser} className="w-full lg:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-3 lg:flex-row lg:space-y-0 lg:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-10 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="w-full lg:w-auto h-10">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>A list of all users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'No users found matching your search.' : 'No users found.'}
              </p>
              {!searchTerm && (
                <Button 
                  className="mt-4" 
                  onClick={handleNewUser}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First User
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="transition-all hover:shadow-md">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                    {/* User Info Section */}
                    <div className="flex-1 space-y-3 lg:space-y-0">
                      <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-base lg:text-lg truncate">{user.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        </div>
                        {/* Badges - Stack on mobile, inline on desktop */}
                        <div className="flex flex-wrap gap-2 lg:flex-nowrap">
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                            {user.role}
                          </Badge>
                          <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="text-xs">
                            {user.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Additional info on mobile */}
                      <div className="lg:hidden text-sm text-muted-foreground space-y-1">
                        {user.department && <p>Department: {user.department}</p>}
                        {user.position && <p>Position: {user.position}</p>}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 lg:flex-row lg:space-y-0 lg:space-x-2 lg:min-w-fit">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full lg:w-auto h-9">
                            <Eye className="h-4 w-4 mr-2 lg:mr-0" />
                            <span className="lg:hidden">View Details</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg mx-auto max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>User Details</DialogTitle>
                            <DialogDescription>
                              View detailed information about this user including their authorization level and system access.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Name</label>
                              <p className="text-sm">{user.name}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Email</label>
                              <p className="text-sm break-all">{user.email}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">User ID</label>
                              <p className="text-sm break-all">{user.userId}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Authorization Level</label>
                              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                {user.role}
                              </Badge>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Status</label>
                              <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                                {user.status}
                              </Badge>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Position</label>
                              <p className="text-sm">{user.position || 'Not specified'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Department</label>
                              <p className="text-sm">{user.department || 'Not specified'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Phone</label>
                              <p className="text-sm">{user.phone || 'Not specified'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Hire Date</label>
                              <p className="text-sm">{user.hire_date || 'Not specified'}</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <div className="flex space-x-2 lg:space-x-1">
                        <Button variant="outline" size="sm" onClick={() => handleEditUser(user)} className="flex-1 lg:flex-none h-9">
                          <Edit className="h-4 w-4 mr-2 lg:mr-0" />
                          <span className="lg:hidden">Edit</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user)} className="flex-1 lg:flex-none h-9">
                          <Trash2 className="h-4 w-4 mr-2 lg:mr-0" />
                          <span className="lg:hidden">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </CardContent>
      </Card>

      <UserFormDialog
        isOpen={userFormOpen}
        onClose={() => setUserFormOpen(false)}
        user={selectedUser}
        onUserSaved={handleUserSaved}
      />

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onDeleted={handleUserDeleted}
        itemType="User"
        itemName={userToDelete?.name || ''}
        itemId={userToDelete?.id || ''}
        tableName="profiles"
      />
    </div>
  );
};

export default Users;