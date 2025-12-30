/**
 * Project Metrics Cards Component
 */

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Clock, CheckCircle, AlertCircle, DollarSign } from "lucide-react";
import { formatCurrency } from '../utils/projectUtils';

interface ProjectMetricsProps {
  stats: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
    totalBudget: number;
  };
}

export const ProjectMetrics = ({ stats }: ProjectMetricsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
              <p className="text-xl lg:text-2xl font-bold">{stats.total}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Active</p>
              <p className="text-xl lg:text-2xl font-bold">{stats.active}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-xl lg:text-2xl font-bold">{stats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">On Hold</p>
              <p className="text-xl lg:text-2xl font-bold">{stats.onHold}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
              <p className="text-xl lg:text-2xl font-bold truncate" title={`₹${stats.totalBudget.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}>
                {formatCurrency(stats.totalBudget)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

