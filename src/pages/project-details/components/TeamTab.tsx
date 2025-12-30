/**
 * Team Tab Component
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, ExternalLink } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface TeamTabProps {
  teamMembers: any[];
  departments: any[];
  loading: boolean;
  onNavigate: (path: string) => void;
}

export const TeamTab = ({ teamMembers, departments, loading, onNavigate }: TeamTabProps) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : teamMembers.length > 0 ? (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback>
                        {member.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.full_name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {member.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </span>
                        )}
                        {member.department && (
                          <span>{member.department}</span>
                        )}
                        {member.position && (
                          <span>• {member.position}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate(`/employee-management?employee_id=${member.user_id}`)}
                  >
                    View Profile <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No team members assigned</p>
          )}
        </CardContent>
      </Card>

      {departments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Department Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {departments.map((dept) => (
                <div key={dept.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{dept.name}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      {dept.manager_name && (
                        <span>Manager: {dept.manager_name}</span>
                      )}
                      {dept.member_count > 0 && (
                        <span>• {dept.member_count} members</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate(`/department-management?department_id=${dept.id}`)}
                  >
                    View Department <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

