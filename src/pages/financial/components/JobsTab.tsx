/**
 * Jobs Tab Component
 * Displays and manages jobs for job costing
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Calculator, ExternalLink, Briefcase } from "lucide-react";
import { getStatusColor } from '../utils/financialFormatters';
import { formatCurrencySymbol } from '../utils/financialFormatters';

interface JobsTabProps {
  jobs: any[];
  loading: boolean;
  searchTerm: string;
  statusFilter: string;
  dateRange: { start: string; end: string };
  pageSize: number;
  onNewJob: () => void;
  onEditJob: (job: any) => void;
  onDeleteJob: (job: any) => void;
  onManageCosts: (job: any) => void;
  deleteLoading: boolean;
}

export const JobsTab = ({
  jobs,
  loading,
  searchTerm,
  statusFilter,
  dateRange,
  pageSize,
  onNewJob,
  onEditJob,
  onDeleteJob,
  onManageCosts,
  deleteLoading,
}: JobsTabProps) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.job_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.client_id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      const matchesDateRange = (!dateRange.start || (job.start_date && new Date(job.start_date) >= new Date(dateRange.start))) &&
        (!dateRange.end || (job.end_date && new Date(job.end_date) <= new Date(dateRange.end)) || 
         (job.start_date && new Date(job.start_date) <= new Date(dateRange.end)));
      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [jobs, searchTerm, statusFilter, dateRange]);

  const paginatedJobs = useMemo(() => {
    return filteredJobs.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [filteredJobs, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredJobs.length / pageSize);

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
          {filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No jobs found</p>
                <p>Create your first job to start tracking project costs and profitability.</p>
              </CardContent>
            </Card>
          ) : (
            paginatedJobs.map((job) => (
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
                      <p className="font-semibold">{formatCurrencySymbol(job.budget || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Actual Cost</p>
                      <p className="font-semibold">{formatCurrencySymbol(job.actual_cost || 0)}</p>
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
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredJobs.length)} of {filteredJobs.length} jobs
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="text-sm">Page {currentPage} of {totalPages}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

