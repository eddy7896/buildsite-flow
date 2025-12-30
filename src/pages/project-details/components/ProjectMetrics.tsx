/**
 * Project Metrics Component
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, DollarSign, FileText, AlertTriangle } from 'lucide-react';
import { Project } from '@/services/api/project-service';
import { statusColors } from '../utils/projectDetailsUtils';
import { formatCurrency } from '../utils/projectDetailsUtils';

interface ProjectMetricsProps {
  project: Project;
  completedTasks: number;
  totalTasks: number;
  taskCompletionRate: number;
  budgetVariance: number;
}

export const ProjectMetrics = ({
  project,
  completedTasks,
  totalTasks,
  taskCompletionRate,
  budgetVariance,
}: ProjectMetricsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Progress</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(project.progress)}%</div>
          <Progress value={project.progress} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(project.budget, project.currency)}</div>
          <p className="text-xs text-muted-foreground">
            Spent: {formatCurrency(project.actual_cost, project.currency)}
          </p>
          {budgetVariance !== 0 && (
            <p className={`text-xs ${budgetVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {budgetVariance > 0 ? '+' : ''}{budgetVariance.toFixed(1)}% variance
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasks</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedTasks}/{totalTasks}</div>
          <p className="text-xs text-muted-foreground">
            {Math.round(taskCompletionRate)}% complete
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge className={statusColors[project.status] || statusColors.planning}>
            {project.status.replace('_', ' ')}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            Priority: {project.priority}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

