import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { TicketIcon, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  avgResolutionTime: number;
  newToday: number;
  resolvedToday: number;
}

interface RecentTicket {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  category: string;
}

export const SupportTicketsWidget = () => {
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTicketStats = async () => {
    try {
      setLoading(true);

      // Simulated ticket stats until database tables are available
      const simulatedStats: TicketStats = {
        total: Math.floor(Math.random() * 100) + 50,
        open: Math.floor(Math.random() * 20) + 5,
        inProgress: Math.floor(Math.random() * 15) + 3,
        resolved: Math.floor(Math.random() * 80) + 30,
        avgResolutionTime: Math.random() * 48 + 12, // hours
        newToday: Math.floor(Math.random() * 5) + 1,
        resolvedToday: Math.floor(Math.random() * 8) + 2,
      };

      setStats(simulatedStats);

      // Simulated recent tickets
      const simulatedTickets: RecentTicket[] = [
        {
          id: '1',
          ticket_number: 'TKT-2025-00001',
          title: 'Unable to generate reports',
          status: 'open',
          priority: 'high',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          category: 'technical',
        },
        {
          id: '2',
          ticket_number: 'TKT-2025-00002',
          title: 'Password reset not working',
          status: 'in_progress',
          priority: 'medium',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          category: 'account',
        },
        {
          id: '3',
          ticket_number: 'TKT-2025-00003',
          title: 'Feature request: Dark mode',
          status: 'resolved',
          priority: 'low',
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          category: 'feature_request',
        },
      ];

      setRecentTickets(simulatedTickets);
    } catch (error: any) {
      console.error('Error fetching ticket stats:', error);
      toast({
        title: "Error loading ticket data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchTicketStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'default';
      case 'resolved': return 'default';
      default: return 'secondary';
    }
  };

  if (loading && !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TicketIcon className="h-5 w-5" />
            Support Tickets
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
          <TicketIcon className="h-5 w-5" />
          Support Tickets
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recent">Recent Tickets</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {stats && (
              <>
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.open}</div>
                    <div className="text-xs text-muted-foreground">Open</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
                    <div className="text-xs text-muted-foreground">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                    <div className="text-xs text-muted-foreground">Resolved</div>
                  </div>
                </div>

                {/* Today's Activity */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Today's Activity</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">New: {stats.newToday}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Resolved: {stats.resolvedToday}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-3">
            {recentTickets.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recentTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{ticket.ticket_number}</span>
                        <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
                          {ticket.priority}
                        </Badge>
                        <Badge variant={getStatusColor(ticket.status)} className="text-xs">
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {ticket.title}
                      </p>
                      <div className="text-xs text-muted-foreground mt-1">
                        {ticket.category} • {new Date(ticket.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TicketIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No support tickets found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};