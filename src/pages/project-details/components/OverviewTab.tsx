/**
 * Overview Tab Component
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building, Mail, Phone, MapPin, Users, FileText, ExternalLink } from 'lucide-react';
import { Project, Task } from '@/services/api/project-service';
import { formatDate, formatCurrency } from '../utils/projectDetailsUtils';

interface OverviewTabProps {
  project: Project;
  tasks: Task[];
  taskCompletionRate: number;
  completedTasks: number;
  totalTasks: number;
  revenue: number;
  clientDetails: any;
  onNavigate: (path: string) => void;
}

export const OverviewTab = ({
  project,
  tasks,
  taskCompletionRate,
  completedTasks,
  totalTasks,
  revenue,
  clientDetails,
  onNavigate,
}: OverviewTabProps) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="mt-1">{project.description || 'No description provided'}</p>
            </div>
            {project.project_type && (
              <div>
                <p className="text-sm text-muted-foreground">Project Type</p>
                <p className="mt-1">{project.project_type}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="mt-1">{formatDate(project.start_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="mt-1">{formatDate(project.end_date)}</p>
              </div>
            </div>
            {project.deadline && (
              <div>
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className="mt-1">{formatDate(project.deadline)}</p>
              </div>
            )}
            {project.client && (
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="mt-1">{project.client.company_name || project.client.name}</p>
                {clientDetails && (
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto mt-1"
                    onClick={() => onNavigate(`/clients?client_id=${project.client_id}`)}
                  >
                    View Client Details <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            )}
            {project.project_manager && (
              <div>
                <p className="text-sm text-muted-foreground">Project Manager</p>
                <p className="mt-1">{project.project_manager.full_name}</p>
              </div>
            )}
            {project.account_manager && (
              <div>
                <p className="text-sm text-muted-foreground">Account Manager</p>
                <p className="mt-1">{project.account_manager.full_name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Budget</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(project.budget, project.currency)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Actual Cost</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(project.actual_cost, project.currency)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(revenue, project.currency)}</p>
            </div>
            {project.budget && project.actual_cost && (
              <div>
                <p className="text-sm text-muted-foreground">Profit Margin</p>
                <p className={`text-2xl font-bold mt-1 ${(revenue - (project.actual_cost || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(revenue - (project.actual_cost || 0), project.currency)}
                </p>
                {project.budget > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {(((revenue - (project.actual_cost || 0)) / project.budget) * 100).toFixed(1)}% margin
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {clientDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">{clientDetails.name}</p>
                  {clientDetails.company_name && (
                    <p className="text-sm text-muted-foreground">{clientDetails.company_name}</p>
                  )}
                </div>
                {clientDetails.contact_person && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{clientDetails.contact_person}</span>
                    {clientDetails.contact_position && (
                      <span className="text-muted-foreground">({clientDetails.contact_position})</span>
                    )}
                  </div>
                )}
                {clientDetails.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{clientDetails.email}</span>
                  </div>
                )}
                {clientDetails.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{clientDetails.phone}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {clientDetails.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{clientDetails.address}</span>
                  </div>
                )}
                {clientDetails.payment_terms && (
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Terms</p>
                    <p className="text-sm font-medium">{clientDetails.payment_terms} days</p>
                  </div>
                )}
                {clientDetails.industry && (
                  <div>
                    <p className="text-sm text-muted-foreground">Industry</p>
                    <Badge variant="outline">{clientDetails.industry}</Badge>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate(`/clients?client_id=${project.client_id}`)}
                >
                  View Full Client Profile <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Task Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Completion Rate</span>
                <span className="font-medium">{Math.round(taskCompletionRate)}%</span>
              </div>
              <Progress value={taskCompletionRate} className="h-2" />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{totalTasks}</p>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{totalTasks - completedTasks}</p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

