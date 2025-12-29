import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Calculator, ExternalLink, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStatusColor } from './types';

interface JobsListProps {
  jobs: any[];
  loading: boolean;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  deleteLoading: boolean;
  onNewJob: () => void;
  onEditJob: (job: any) => void;
  onDeleteJob: (job: any) => void;
  onManageCosts: (job: any) => void;
  onPageChange: (page: number) => void;
}

export function JobsList({
  jobs,
  loading,
  pageSize,
  currentPage,
  totalPages,
  totalItems,
  deleteLoading,
  onNewJob,
  onEditJob,
  onDeleteJob,
  onManageCosts,
  onPageChange
}: JobsListProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Job Cost Management</h3>
        <Button onClick={onNewJob}>
          <Plus className="h-4 w-4 mr-2" />
          New Job
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading jobs...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No jobs found</p>
                <p>Create your first job to start tracking project costs and profitability.</p>
              </CardContent>
            </Card>
          ) : (
            jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {job.job_number} • {job.client_id || 'No client assigned'}
                      </p>
                    </div>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="font-semibold">₹{(job.budget || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Actual Cost</p>
                      <p className="font-semibold">₹{(job.actual_cost || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Hours (Est/Act)</p>
                      <p className="font-semibold">{job.estimated_hours || 0}/{job.actual_hours || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Profit Margin</p>
                      <p className="font-semibold">{job.profit_margin || 0}%</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEditJob(job)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onManageCosts(job)}>
                      <Calculator className="h-4 w-4 mr-1" />
                      Manage Costs
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/jobs/${job.id}`)}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onDeleteJob(job)}
                      disabled={deleteLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} jobs
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="text-sm">Page {currentPage} of {totalPages}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
