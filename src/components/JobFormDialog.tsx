import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Job {
  id?: string;
  job_number?: string;
  title: string;
  description: string;
  client_id: string;
  category_id: string;
  status: string;
  start_date: string;
  end_date: string;
  estimated_hours: number;
  estimated_cost: number;
  budget: number;
  profit_margin: number;
  assigned_to: string;
}

interface JobFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job?: Job | null;
  onJobSaved: () => void;
}

const JobFormDialog: React.FC<JobFormDialogProps> = ({ isOpen, onClose, job, onJobSaved }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Job>({
    title: job?.title || '',
    description: job?.description || '',
    client_id: job?.client_id || '',
    category_id: job?.category_id || '',
    status: job?.status || 'planning',
    start_date: job?.start_date || '',
    end_date: job?.end_date || '',
    estimated_hours: job?.estimated_hours || 0,
    estimated_cost: job?.estimated_cost || 0,
    budget: job?.budget || 0,
    profit_margin: job?.profit_margin || 0,
    assigned_to: job?.assigned_to || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (job?.id) {
        // Update existing job
        const { error } = await supabase
          .from('jobs')
          .update(formData)
          .eq('id', job.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Job updated successfully',
        });
      } else {
        // Create new job
        const jobNumber = `J-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
        const { error } = await supabase
          .from('jobs')
          .insert([{ ...formData, job_number: jobNumber }]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Job created successfully',
        });
      }

      onJobSaved();
      onClose();
    } catch (error) {
      console.error('Error saving job:', error);
      toast({
        title: 'Error',
        description: 'Failed to save job',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{job?.id ? 'Edit Job' : 'Create New Job'}</DialogTitle>
          <DialogDescription>
            {job?.id ? 'Update job details below.' : 'Fill in the details to create a new job.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Estimated Hours</Label>
              <Input
                id="estimated_hours"
                type="number"
                value={formData.estimated_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_cost">Estimated Cost (₹)</Label>
              <Input
                id="estimated_cost"
                type="number"
                value={formData.estimated_cost}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_cost: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (₹)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profit_margin">Profit Margin (%)</Label>
              <Input
                id="profit_margin"
                type="number"
                value={formData.profit_margin}
                onChange={(e) => setFormData(prev => ({ ...prev, profit_margin: Number(e.target.value) }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : job?.id ? 'Update Job' : 'Create Job'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JobFormDialog;