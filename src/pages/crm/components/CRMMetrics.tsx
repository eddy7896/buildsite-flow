/**
 * CRM Metrics Component
 */

import { Card, CardContent } from '@/components/ui/card';
import { Users2, Target, TrendingUp } from 'lucide-react';

interface CRMMetricsProps {
  totalLeads: number;
  activeLeads: number;
  conversionRate: number;
  pipelineValue: number;
}

export const CRMMetrics = ({ totalLeads, activeLeads, conversionRate, pipelineValue }: CRMMetricsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Users2 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate">Total Leads</p>
              <p className="text-xl font-bold truncate">{totalLeads}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate">Active Leads</p>
              <p className="text-xl font-bold truncate">{activeLeads}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate">Conversion Rate</p>
              <p className="text-xl font-bold truncate">{conversionRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate">Pipeline Value</p>
              <p className="text-xl font-bold truncate">
                {pipelineValue > 0 
                  ? `₹${pipelineValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                  : '₹0'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

