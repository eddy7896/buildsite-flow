import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users2, Mail, Phone, MapPin, Calendar, Crown, Star, Shield } from 'lucide-react';
import { getRoleDisplayName, ROLE_CATEGORIES } from '@/utils/roleUtils';

// Mock team data based on role
const getTeamDataByRole = (userRole: string) => {
  const baseTeam = [
    {
      id: 'tm001',
      name: 'Sarah Johnson',
      role: 'project_manager',
      department: 'Development',
      email: 'sarah.johnson@company.com',
      phone: '+1 (555) 123-4567',
      location: 'New York, NY',
      joinDate: '2023-01-15',
      avatar: null,
      status: 'active'
    },
    {
      id: 'tm002',
      name: 'Mike Chen',
      role: 'employee',
      department: 'Development',
      email: 'mike.chen@company.com',
      phone: '+1 (555) 234-5678',
      location: 'San Francisco, CA',
      joinDate: '2023-03-20',
      avatar: null,
      status: 'active'
    },
    {
      id: 'tm003',
      name: 'Emily Rodriguez',
      role: 'employee',
      department: 'Design',
      email: 'emily.rodriguez@company.com',
      phone: '+1 (555) 345-6789',
      location: 'Austin, TX',
      joinDate: '2023-02-10',
      avatar: null,
      status: 'active'
    },
    {
      id: 'tm004',
      name: 'David Kim',
      role: 'team_lead',
      department: 'Development',
      email: 'david.kim@company.com',
      phone: '+1 (555) 456-7890',
      location: 'Seattle, WA',
      joinDate: '2022-11-05',
      avatar: null,
      status: 'active'
    },
    {
      id: 'tm005',
      name: 'Lisa Wang',
      role: 'contractor',
      department: 'Marketing',
      email: 'lisa.wang@company.com',
      phone: '+1 (555) 567-8901',
      location: 'Los Angeles, CA',
      joinDate: '2023-04-01',
      avatar: null,
      status: 'active'
    }
  ];

  // Filter team based on role hierarchy
  if (ROLE_CATEGORIES.executive.includes(userRole as any)) {
    return baseTeam; // Executives see all team members
  } else if (ROLE_CATEGORIES.management.includes(userRole as any)) {
    return baseTeam.filter(member => 
      ROLE_CATEGORIES.specialized.includes(member.role as any) || 
      ROLE_CATEGORIES.general.includes(member.role as any)
    );
  } else {
    // General staff see project collaborators
    return baseTeam.slice(0, 3);
  }
};

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
  const { userRole } = useAuth();
  
  const teamData = getTeamDataByRole(userRole || 'employee');
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getScopeDescription = (role: string) => {
    if (ROLE_CATEGORIES.executive.includes(role as any)) {
      return 'Organization-wide team overview';
    } else if (ROLE_CATEGORIES.management.includes(role as any)) {
      return 'Your direct reports and managed teams';
    } else {
      return 'Your project collaborators and teammates';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Users2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Team</h1>
          <p className="text-muted-foreground">
            {getScopeDescription(userRole || 'employee')}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teamData.map((member) => {
          const RoleIcon = getRoleIcon(member.role);
          
          return (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg leading-6 truncate">
                      {member.name}
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
                  
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{member.phone}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{member.location}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(member.joinDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {member.department}
                    </Badge>
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {teamData.length === 0 && (
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
    </div>
  );
}