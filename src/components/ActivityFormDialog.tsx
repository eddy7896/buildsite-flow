import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/database';
import { useAuth } from '@/hooks/useAuth';
import { generateUUID } from '@/lib/uuid';

interface Activity {
  id?: string;
  lead_id?: string;
  client_id?: string;
  activity_type: string;
  subject: string;
  description?: string;
  status: string;
  due_date: string;
  completed_date?: string;
  assigned_to?: string;
}

interface ActivityFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activity?: Activity | null;
  leadId?: string;
  onActivitySaved: () => void;
}

const formatDateTimeLocal = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
};

const ActivityFormDialog: React.FC<ActivityFormDialogProps> = ({ 
  isOpen, 
  onClose, 
  activity, 
  leadId,
  onActivitySaved 
}) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [formData, setFormData] = useState<Activity>({
    lead_id: activity?.lead_id || leadId || '',
    client_id: activity?.client_id || '',
    activity_type: activity?.activity_type || 'call',
    subject: activity?.subject || '',
    description: activity?.description || '',
    status: activity?.status || 'pending',
    due_date: activity?.due_date || '',
    completed_date: activity?.completed_date || '',
    assigned_to: activity?.assigned_to || '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchLeads();
      if (activity && activity.id) {
        setFormData({
          lead_id: activity.lead_id || '',
          client_id: activity.client_id || '',
          activity_type: activity.activity_type || 'call',
          subject: activity.subject || '',
          description: activity.description || '',
          status: activity.status || 'pending',
          due_date: activity.due_date || '',
          completed_date: activity.completed_date || '',
          assigned_to: activity.assigned_to || '',
        });
      } else {
        setFormData({
          lead_id: leadId || activity?.lead_id || '',
          client_id: '',
          activity_type: 'call',
          subject: '',
          description: '',
          status: 'pending',
          due_date: '',
          completed_date: '',
          assigned_to: '',
        });
      }
    }
  }, [isOpen, activity, leadId]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await db
        .from('leads')
        .select('id, company_name, lead_number')
        .order('company_name', { ascending: true });
      
      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const agencyId = profile?.agency_id || '550e8400-e29b-41d4-a716-446655440000';
      const userId = user?.id || '550e8400-e29b-41d4-a716-446655440011';

      if (activity?.id) {
        const updateData: any = {
          lead_id: (formData.lead_id && formData.lead_id !== '__none__') ? formData.lead_id : null,
          client_id: formData.client_id || null,
          activity_type: formData.activity_type,
          subject: formData.subject,
          description: formData.description || null,
          status: formData.status,
          due_date: formData.due_date || null,
          completed_date: formData.completed_date || null,
          assigned_to: formData.assigned_to || null,
          updated_at: new Date().toISOString(),
        };

        // If status is completed and completed_date is not set, set it
        if (formData.status === 'completed' && !formData.completed_date) {
          updateData.completed_date = new Date().toISOString();
        }

        const { data, error } = await db
          .from('crm_activities')
          .update(updateData)
          .eq('id', activity.id)
          .select()
          .single();

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Activity updated successfully',
        });
      } else {
        const { data, error } = await db
          .from('crm_activities')
          .insert([{
            id: generateUUID(),
            lead_id: (formData.lead_id && formData.lead_id !== '__none__') ? formData.lead_id : null,
            client_id: formData.client_id || null,
            activity_type: formData.activity_type,
            subject: formData.subject,
            description: formData.description || null,
            status: formData.status,
            due_date: formData.due_date || null,
            completed_date: formData.completed_date || null,
            assigned_to: formData.assigned_to || null,
            created_by: userId,
            agency_id: agencyId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Activity created successfully',
        });
      }

      onActivitySaved();
      onClose();
    } catch (error: any) {
      console.error('Error saving activity:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save activity',
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
          <DialogTitle>{activity?.id ? 'Edit Activity' : 'Create New Activity'}</DialogTitle>
          <DialogDescription>
            {activity?.id ? 'Update activity details below.' : 'Fill in the details to create a new activity.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lead_id">Lead</Label>
              <Select 
                value={formData.lead_id || undefined} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, lead_id: value === '__none__' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lead (optional)" />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.lead_number} - {lead.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity_type">Activity Type</Label>
              <Select 
                value={formData.activity_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, activity_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              required
            />
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
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="datetime-local"
                value={formatDateTimeLocal(formData.due_date)}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
              />
            </div>
          </div>

          {formData.status === 'completed' && (
            <div className="space-y-2">
              <Label htmlFor="completed_date">Completed Date</Label>
              <Input
                id="completed_date"
                type="datetime-local"
                value={formatDateTimeLocal(formData.completed_date)}
                onChange={(e) => setFormData(prev => ({ ...prev, completed_date: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : activity?.id ? 'Update Activity' : 'Create Activity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityFormDialog;

