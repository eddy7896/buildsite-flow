import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/database';
import { toast } from 'sonner';
import { AppRole, ROLE_DISPLAY_NAMES, getAssignableRoles } from '@/utils/roleUtils';

interface RoleChangeRequest {
  id: string;
  user_id: string;
  existing_role: AppRole;
  requested_role: AppRole;
  reason: string;
  requested_by: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  created_at: string;
  expires_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  requested_by_profile?: {
    full_name: string;
  };
}

export function RoleChangeRequests() {
  const { userRole, user } = useAuth();
  const [requests, setRequests] = useState<RoleChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRequest, setNewRequest] = useState({
    user_id: '',
    requested_role: '' as AppRole,
    reason: ''
  });
  const [employees, setEmployees] = useState<any[]>([]);

  const canManageRoleChanges = userRole && ['super_admin', 'ceo'].includes(userRole);
  const canCreateRequests = userRole && ['admin', 'hr', 'department_head'].includes(userRole);

  const fetchRequests = async () => {
    try {
      const { data: requests, error } = await db
        .from('role_change_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for user_id and requested_by
      const userIds = new Set<string>();
      (requests || []).forEach(req => {
        if (req.user_id) userIds.add(req.user_id);
        if (req.requested_by) userIds.add(req.requested_by);
      });

      let profileMap = new Map<string, { full_name: string; email?: string }>();
      if (userIds.size > 0) {
        const { data: profiles } = await db
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', Array.from(userIds));

        if (profiles) {
          profiles.forEach(profile => {
            profileMap.set(profile.user_id, { full_name: profile.full_name });
          });
        }

        // Fetch emails from users table
        const { data: users } = await db
          .from('users')
          .select('id, email')
          .in('id', Array.from(userIds));

        if (users) {
          users.forEach(user => {
            const profile = profileMap.get(user.id);
            if (profile) {
              profile.email = user.email;
            }
          });
        }
      }

      setRequests((requests || []).map(item => ({
        ...item,
        profiles: profileMap.get(item.user_id) || null,
        requested_by_profile: item.requested_by ? (profileMap.get(item.requested_by) || null) : null
      })));
    } catch (error) {
      console.error('Error fetching role change requests:', error);
      toast.error('Failed to load role change requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await db
        .from('profiles')
        .select('user_id, full_name')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      
      // Fetch emails from users table
      const userIds = (data || []).map(p => p.user_id).filter(Boolean);
      let emailMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: users } = await db
          .from('users')
          .select('id, email')
          .in('id', userIds);
        
        if (users) {
          users.forEach(user => {
            emailMap.set(user.id, user.email);
          });
        }
      }
      
      setEmployees((data || []).map(profile => ({
        ...profile,
        email: emailMap.get(profile.user_id) || ''
      })));
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
    if (canCreateRequests) {
      fetchEmployees();
    }
  }, [canCreateRequests]);

  const handleCreateRequest = async () => {
    if (!user || !newRequest.user_id || !newRequest.requested_role) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { insertRecord } = await import('@/services/api/postgresql-service');
      await insertRecord('role_change_requests', {
        id: (await import('@/lib/uuid')).generateUUID(),
        user_id: newRequest.user_id,
        requested_role: newRequest.requested_role,
        reason: newRequest.reason,
        requested_by: user.id,
        status: 'pending'
      });

      toast.success('Role change request created successfully');
      setShowCreateDialog(false);
      setNewRequest({ user_id: '', requested_role: '' as AppRole, reason: '' });
      fetchRequests();
    } catch (error) {
      console.error('Error creating role change request:', error);
      toast.error('Failed to create role change request');
    }
  };

  const handleApproveRequest = async (requestId: string, action: 'approved' | 'rejected') => {
    if (!user) return;

    try {
      const { updateRecord } = await import('@/services/api/postgresql-service');
      await updateRecord('role_change_requests', {
        status: action,
        approved_by: action === 'approved' ? user.id : null,
        rejected_by: action === 'rejected' ? user.id : null
      }, { id: requestId });

      // If approved, update the user's role
      if (action === 'approved') {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          // Find and update the user role
          const { selectOne } = await import('@/services/api/postgresql-service');
          const existingRole = await selectOne('user_roles', { user_id: request.user_id });
          if (existingRole) {
            await updateRecord('user_roles', { role: request.requested_role }, { id: existingRole.id });
          }
        }
      }

      toast.success(`Request ${action} successfully`);
      fetchRequests();
    } catch (error) {
      console.error(`Error ${action} request:`, error);
      toast.error(`Failed to ${action} request`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'approved' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{status.toUpperCase()}</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Role Change Requests</h1>
          <p className="text-muted-foreground">Manage user role change requests and approvals</p>
        </div>
        {canCreateRequests && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Create Request
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No role change requests</p>
              <p className="text-muted-foreground">All requests will appear here when created</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(request.status)}
                    <CardTitle className="text-lg">
                      {request.profiles?.full_name || 'Unknown User'}
                    </CardTitle>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(request.created_at).toLocaleDateString()}
                  </div>
                </div>
                <CardDescription>
                  Requested by: {request.requested_by_profile?.full_name || 'Unknown'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Current Role</h4>
                    <Badge variant="outline">
                      {ROLE_DISPLAY_NAMES[request.existing_role] || request.existing_role}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium">Requested Role</h4>
                    <Badge variant="default">
                      {ROLE_DISPLAY_NAMES[request.requested_role] || request.requested_role}
                    </Badge>
                  </div>
                </div>
                
                {request.reason && (
                  <div>
                    <h4 className="font-medium mb-2">Reason</h4>
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                  </div>
                )}

                {canManageRoleChanges && request.status === 'pending' && (
                  <div className="flex space-x-2 pt-4">
                    <Button
                      size="sm"
                      onClick={() => handleApproveRequest(request.id, 'approved')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleApproveRequest(request.id, 'rejected')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Role Change Request</DialogTitle>
            <DialogDescription>
              Request a role change for an employee. This will require approval from authorized personnel.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Employee</label>
              <Select
                value={newRequest.user_id}
                onValueChange={(value) => setNewRequest(prev => ({ ...prev, user_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.user_id} value={employee.user_id}>
                      {employee.full_name} ({employee.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Requested Role</label>
              <Select
                value={newRequest.requested_role}
                onValueChange={(value) => setNewRequest(prev => ({ ...prev, requested_role: value as AppRole }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {userRole && getAssignableRoles(userRole).map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_DISPLAY_NAMES[role] || role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                value={newRequest.reason}
                onChange={(e) => setNewRequest(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Explain why this role change is needed..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRequest}>
              Create Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}