import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users2, Mail, Phone, MapPin, Calendar, Crown, Star, Shield, Loader2, UserPlus, Edit, Eye } from 'lucide-react';
import { getRoleDisplayName, ROLE_CATEGORIES } from '@/utils/roleUtils';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { getTeamMembers, TeamMember } from '@/services/api/team-service';
import { selectRecords } from '@/services/api/postgresql-service';

// TeamMember interface is now imported from team-service

const getRoleIcon = (role: string) => {
  if (ROLE_CATEGORIES.executive.includes(role as any)) return Crown;
  if (ROLE_CATEGORIES.management.includes(role as any)) return Shield;
  return Star;
};

const getRoleBadgeVariant = (role: string) => {
  if (ROLE_CATEGORIES.executive.includes(role as any)) return 'default';
  if (ROLE_CATEGORIES.management.includes(role as any)) return 'secondary';
  return 'outline';
};

export default function MyTeam() {
  const { userRole, user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [userDepartmentId, setUserDepartmentId] = useState<string | null>(null);
  
  useEffect(() => {
    if (user?.id) {
      fetchUserDepartment();
    }
  }, [user?.id, profile?.agency_id]);

  useEffect(() => {
    if (user && userRole && profile) {
      // Add a small delay to ensure department is fetched first
      const timer = setTimeout(() => {
        fetchTeamMembers();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // If user/profile not ready, stop loading
      setLoading(false);
    }
  }, [user?.id, userRole, profile?.agency_id, userDepartmentId]);

  // Fetch user's department ID from team_assignments
  const fetchUserDepartment = async () => {
    if (!user?.id) {
      setUserDepartmentId(null);
      return;
    }

    try {
      const teamAssignments = await selectRecords('team_assignments', {
        filters: [
          { column: 'user_id', operator: 'eq', value: user.id },
          { column: 'is_active', operator: 'eq', value: true }
        ],
        limit: 1
      });

      if (teamAssignments.length > 0 && teamAssignments[0].department_id) {
        setUserDepartmentId(teamAssignments[0].department_id);
      } else {
        setUserDepartmentId(null);
      }
    } catch (error) {
      console.error('Error fetching user department:', error);
      setUserDepartmentId(null);
    }
  };

  const fetchTeamMembers = async () => {
    if (!user?.id || !userRole) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      console.log('Fetching team members for:', {
        userId: user.id,
        userRole,
        userDepartmentId,
        userDepartmentName: profile?.department,
        agencyId: profile?.agency_id,
      });
      
      const members = await getTeamMembers({
        userId: user.id,
        userRole: userRole as any,
        userDepartmentId: userDepartmentId || null,
        userDepartmentName: profile?.department || null,
        agencyId: profile?.agency_id || null,
      });

      console.log('Team members fetched:', members.length);
      setTeamMembers(members);
    } catch (error) {
      console.error('Error fetching team:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team members. Please try again.',
        variant: 'destructive',
      });
      setTeamMembers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getScopeDescription = (role: string) => {
    if (ROLE_CATEGORIES.executive.includes(role as any)) {
      return 'All employees in your organization';
    } else if (ROLE_CATEGORIES.management.includes(role as any)) {
      return 'Your direct reports and managed teams';
    } else if (role === 'department_head') {
      return 'All members of your department';
    } else if (role === 'team_lead') {
      return 'Your direct reports and team members';
    } else if (role === 'project_manager') {
      return 'Your project team members';
    } else {
      return 'Your project collaborators and teammates';
    }
  };

  const viewMemberProfile = (member: TeamMember) => {
    setSelectedMember(member);
    setShowMemberDialog(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading team members...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Team</h1>
            <p className="text-muted-foreground">
              {getScopeDescription(userRole || 'employee')}
            </p>
          </div>
        </div>
        {(userRole === 'super_admin' || userRole === 'admin' || userRole === 'hr') && (
          <Button onClick={() => navigate('/create-employee')}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Team Member
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-sm text-muted-foreground">Total Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {teamMembers.filter(m => ROLE_CATEGORIES.management.includes(m.role as any)).length}
            </div>
            <p className="text-sm text-muted-foreground">Managers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {new Set(teamMembers.map(m => m.department).filter(Boolean)).size}
            </div>
            <p className="text-sm text-muted-foreground">Departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {teamMembers.filter(m => m.is_active).length}
            </div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teamMembers.map((member) => {
          const RoleIcon = getRoleIcon(member.role);
          
          return (
            <Card key={member.id} className="hover:shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg leading-6 truncate">
                      {member.full_name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <RoleIcon className="h-4 w-4 text-muted-foreground" />
                      <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs">
                        {getRoleDisplayName(member.role as any)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  
                  {member.phone && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  
                  {member.location && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{member.location}</span>
                    </div>
                  )}
                  
                  {member.hire_date && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {new Date(member.hire_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {member.department || 'No Department'}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => viewMemberProfile(member)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {teamMembers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users2 className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-xl mb-2">No team members found</CardTitle>
            <CardDescription>
              Your team information will appear here once team members are assigned.
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {/* Member Detail Dialog */}
      <Dialog open={showMemberDialog} onOpenChange={setShowMemberDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Team Member Profile</DialogTitle>
            <DialogDescription>
              Detailed information about the team member
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedMember.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                    {getInitials(selectedMember.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedMember.full_name}</h3>
                  <p className="text-muted-foreground">{selectedMember.position || 'No position'}</p>
                  <Badge variant={getRoleBadgeVariant(selectedMember.role)} className="mt-1">
                    {getRoleDisplayName(selectedMember.role as any)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedMember.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedMember.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{selectedMember.department || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedMember.location || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hire Date</p>
                  <p className="font-medium">
                    {selectedMember.hire_date 
                      ? new Date(selectedMember.hire_date).toLocaleDateString()
                      : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedMember.is_active ? 'default' : 'destructive'}>
                    {selectedMember.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
