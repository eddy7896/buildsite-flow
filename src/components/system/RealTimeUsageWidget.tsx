import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/database';
import { Activity, Users, Clock, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UsageMetrics {
  activeUsers: number;
  activeSessions: number;
  recentActions: number;
  peakHour: string;
  totalActionsToday: number;
  avgResponseTime: number;
}

interface RecentActivity {
  id: string;
  action_type: string;
  resource_type: string;
  timestamp: string;
  user_count: number;
}

export const RealTimeUsageWidget = () => {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsageMetrics = async () => {
    try {
      setLoading(true);

      // Simulated metrics until database tables are available
      const simulatedMetrics: UsageMetrics = {
        activeUsers: Math.floor(Math.random() * 25) + 5,
        activeSessions: Math.floor(Math.random() * 100) + 50,
        recentActions: Math.floor(Math.random() * 50) + 10,
        peakHour: `${Math.floor(Math.random() * 24)}:00`,
        totalActionsToday: Math.floor(Math.random() * 1000) + 500,
        avgResponseTime: Math.random() * 100 + 50,
      };

      setMetrics(simulatedMetrics);

      // Simulated recent activity
      const simulatedActivity: RecentActivity[] = [
        {
          id: '1',
          action_type: 'create',
          resource_type: 'project',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          user_count: 3,
        },
        {
          id: '2',
          action_type: 'update',
          resource_type: 'invoice',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          user_count: 1,
        },
        {
          id: '3',
          action_type: 'view',
          resource_type: 'dashboard',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          user_count: 8,
        },
      ];

      setRecentActivity(simulatedActivity);

    } catch (error: any) {
      console.error('Error fetching usage metrics:', error);
      toast({
        title: "Error loading usage data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageMetrics();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsageMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatActionType = (action: string) => {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatResourceType = (resource: string) => {
    return resource.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading && !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-Time Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Real-Time Usage
          <Badge variant="outline" className="ml-auto">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics && (
          <>
            {/* Current Activity Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.activeUsers}</div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Users className="h-3 w-3" />
                  Active Now
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.activeSessions}</div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  Sessions Today
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{metrics.recentActions}</div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Actions (5m)
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{metrics.peakHour}</div>
                <div className="text-xs text-muted-foreground">
                  Peak Hour
                </div>
              </div>
            </div>

            {/* Today's Summary */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Today's Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Actions</span>
                  <span className="font-medium">{metrics.totalActionsToday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg Response</span>
                  <span className="font-medium">{metrics.avgResponseTime.toFixed(0)}ms</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Recent Activity */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Recent Activity</h4>
          {recentActivity.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex-1">
                    <span className="text-sm font-medium">
                      {formatActionType(activity.action_type)}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {formatResourceType(activity.resource_type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {activity.user_count} users
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Activity className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};