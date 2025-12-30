/**
 * Reports Tab Component
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PIPELINE_STAGES, getStatusColor } from '../utils/crmUtils';

interface ReportsTabProps {
  leads: any[];
  activities: any[];
  loading: boolean;
  activitiesLoading: boolean;
}

export const ReportsTab = ({ leads, activities, loading, activitiesLoading }: ReportsTabProps) => {
  // Lead Source Performance
  const sourceStats: Record<string, { count: number; value: number }> = {};
  leads.forEach(lead => {
    const sourceId = lead.lead_source_id || lead.source_id || 'unknown';
    if (!sourceStats[sourceId]) {
      sourceStats[sourceId] = { count: 0, value: 0 };
    }
    sourceStats[sourceId].count++;
    sourceStats[sourceId].value += (lead.estimated_value || lead.value || 0);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>CRM Reports & Analytics</CardTitle>
        <p className="text-muted-foreground">View insights and performance metrics for your CRM</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lead Source Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lead Source Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(sourceStats).map(([sourceId, stats]) => (
                    <div key={sourceId} className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm font-medium">
                        {sourceId === 'unknown' ? 'Unknown Source' : `Source ${sourceId.slice(0, 8)}`}
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{stats.count} leads</div>
                        <div className="text-xs text-muted-foreground">
                          ₹{stats.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : (
                <div className="space-y-3">
                  {PIPELINE_STAGES.map(stage => {
                    const stageLeads = leads.filter(l => l.status === stage.status);
                    const percentage = leads.length > 0 ? (stageLeads.length / leads.length) * 100 : 0;
                    return (
                      <div key={stage.status} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{stage.name}</span>
                          <span>{stageLeads.length} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="text-center py-4">Loading...</div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between p-2 border rounded">
                    <span className="text-sm">Total Activities</span>
                    <span className="font-semibold">{activities.length}</span>
                  </div>
                  <div className="flex justify-between p-2 border rounded">
                    <span className="text-sm">Pending</span>
                    <span className="font-semibold">
                      {activities.filter(a => a.status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 border rounded">
                    <span className="text-sm">Completed</span>
                    <span className="font-semibold">
                      {activities.filter(a => a.status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 border rounded">
                    <span className="text-sm">In Progress</span>
                    <span className="font-semibold">
                      {activities.filter(a => a.status === 'in_progress').length}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Leads by Value */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Leads by Value</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {leads
                    .filter(l => (l.estimated_value || l.value) && (l.estimated_value || l.value || 0) > 0)
                    .sort((a, b) => ((b.estimated_value || b.value || 0) - (a.estimated_value || a.value || 0)))
                    .slice(0, 5)
                    .map(lead => (
                      <div key={lead.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <div className="text-sm font-medium">{lead.company_name || lead.name}</div>
                          <div className="text-xs text-muted-foreground">{lead.lead_number}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">
                            ₹{((lead.estimated_value || lead.value || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </div>
                          <Badge className={getStatusColor(lead.status)} variant="outline" style={{ fontSize: '10px' }}>
                            {lead.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  {leads.filter(l => (l.estimated_value || l.value) && (l.estimated_value || l.value || 0) > 0).length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No leads with estimated value
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

