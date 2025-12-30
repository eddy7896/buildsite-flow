/**
 * Activities Tab Component
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getActivityIcon } from '../utils/crmUtils';

interface ActivitiesTabProps {
  activities: any[];
  loading: boolean;
  onNewActivity: () => void;
  onEditActivity: (activity: any) => void;
  onDeleteActivity: (activity: any) => void;
}

export const ActivitiesTab = ({
  activities,
  loading,
  onNewActivity,
  onEditActivity,
  onDeleteActivity,
}: ActivitiesTabProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Activities</h3>
        <Button variant="outline" onClick={onNewActivity}>
          <Plus className="h-4 w-4 mr-2" />
          New Activity
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading activities...</div>
      ) : (
        <div className="grid gap-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No activities found. Create your first activity to get started.
            </div>
          ) : (
            activities.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.activity_type);
              const lead = activity.leads || null;
              return (
                <Card 
                  key={activity.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer" 
                  onClick={() => navigate(`/crm/activities/${activity.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <ActivityIcon className="h-8 w-8 text-blue-600" />
                      <div className="flex-1">
                        <h4 className="font-semibold">{activity.subject}</h4>
                        <p className="text-sm text-muted-foreground">
                          {lead ? `${lead.lead_number} - ${lead.company_name || lead.name}` : 'No lead assigned'}
                        </p>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{activity.description}</p>
                        )}
                      </div>
                      <div className="text-right flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                        {activity.due_date && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(activity.due_date).toLocaleDateString()}
                          </div>
                        )}
                        <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                          {activity.status}
                        </Badge>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => onEditActivity(activity)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => onDeleteActivity(activity)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

