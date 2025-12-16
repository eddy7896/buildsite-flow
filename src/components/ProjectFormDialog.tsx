import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/database';
import { generateUUID } from '@/lib/uuid';
import { getAgencyId } from '@/utils/agencyUtils';

interface Project {
  id?: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  client_id: string | null;
  assigned_team: any; // JSONB
  progress: number;
}

interface Client {
  id: string;
  name: string;
  company_name: string | null;
}

interface ProjectFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  onProjectSaved: () => void;
}

const ProjectFormDialog: React.FC<ProjectFormDialogProps> = ({ isOpen, onClose, project, onProjectSaved }) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [teamMemberInput, setTeamMemberInput] = useState('');
  const [teamMembers, setTeamMembers] = useState<string[]>([]);

  const [formData, setFormData] = useState<Project>({
    name: '',
    description: '',
    status: 'planning',
    start_date: null,
    end_date: null,
    budget: null,
    client_id: null,
    assigned_team: [],
    progress: 0,
  });

  // Normalize status value for display (convert database format to form format)
  const normalizeStatusForDisplay = (status: string | undefined): string => {
    if (!status) return 'planning';
    // Convert database format (in_progress) to form format (in-progress) for display
    if (status === 'in_progress') return 'in-progress';
    if (status === 'on_hold') return 'on-hold';
    return status;
  };

  // Normalize status value for database (convert form format to database format)
  const normalizeStatusForDatabase = (status: string): string => {
    // Convert form format (in-progress) to database format (in_progress)
    if (status === 'in-progress') return 'in_progress';
    if (status === 'on-hold') return 'on_hold';
    return status;
  };

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | null | undefined): string | null => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  };

  // Update form data when project prop changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      if (project && project.id) {
        // Editing existing project - populate form with project data
        console.log('Loading project data:', project); // Debug log
        setFormData({
          name: project.name || '',
          description: project.description || '',
          status: normalizeStatusForDisplay(project.status),
          start_date: formatDateForInput(project.start_date),
          end_date: formatDateForInput(project.end_date),
          budget: project.budget || null,
          client_id: project.client_id || null,
          assigned_team: [],
          progress: project.progress || 0,
        });

        // Parse assigned_team from project
        if (project.assigned_team) {
          let parsed: string[] = [];
          if (typeof project.assigned_team === 'string') {
            try {
              parsed = JSON.parse(project.assigned_team);
            } catch {
              parsed = [];
            }
          } else if (Array.isArray(project.assigned_team)) {
            parsed = project.assigned_team.map((m: any) => typeof m === 'string' ? m : m.name || String(m));
          }
          setTeamMembers(parsed);
        } else {
          setTeamMembers([]);
        }
      } else {
        // Creating new project - reset form
        setFormData({
          name: '',
          description: '',
          status: 'planning',
          start_date: null,
          end_date: null,
          budget: null,
          client_id: null,
          assigned_team: [],
          progress: 0,
        });
        setTeamMembers([]);
        setTeamMemberInput('');
      }
    }
  }, [project, isOpen]);

  // Fetch clients when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen]);

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const agencyId = await getAgencyId(profile, user?.id);
      if (!agencyId) {
        toast({
          title: 'Error',
          description: 'Agency ID not found. Please ensure you are logged in to an agency account.',
          variant: 'destructive',
        });
        setLoadingClients(false);
        return;
      }
      
      const { data, error } = await db
        .from('clients')
        .select('id, name, company_name')
        .eq('agency_id', agencyId)
        .order('name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clients',
        variant: 'destructive',
      });
    } finally {
      setLoadingClients(false);
    }
  };

  const addTeamMember = () => {
    if (teamMemberInput.trim() && !teamMembers.includes(teamMemberInput.trim())) {
      setTeamMembers([...teamMembers, teamMemberInput.trim()]);
      setTeamMemberInput('');
    }
  };

  const removeTeamMember = (member: string) => {
    setTeamMembers(teamMembers.filter(m => m !== member));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Project name is required',
        variant: 'destructive',
      });
      return;
    }

    if (formData.progress < 0 || formData.progress > 100) {
      toast({
        title: 'Validation Error',
        description: 'Progress must be between 0 and 100',
        variant: 'destructive',
      });
      return;
    }

    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      toast({
        title: 'Validation Error',
        description: 'End date must be after start date',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const agencyId = await getAgencyId(profile, user?.id);
      if (!agencyId) {
        toast({
          title: 'Error',
          description: 'Agency ID not found. Please ensure you are logged in to an agency account.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      const userId = user?.id;
      if (!userId) {
        toast({
          title: 'Error',
          description: 'User ID not found. Please log in again.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const cleanedData: any = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        status: normalizeStatusForDatabase(formData.status), // Convert to database format
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        budget: formData.budget || null,
        client_id: formData.client_id || null,
        assigned_team: teamMembers.length > 0 ? JSON.stringify(teamMembers) : null,
        progress: formData.progress,
        agency_id: agencyId,
      };

      if (project?.id) {
        // Update existing project
        const { error } = await db
          .from('projects')
          .update(cleanedData)
          .eq('id', project.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Project updated successfully',
        });
      } else {
        // Create new project
        cleanedData.id = generateUUID();
        cleanedData.created_by = userId;
        
        const { error } = await db
          .from('projects')
          .insert([cleanedData]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Project created successfully',
        });
      }

      onProjectSaved();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        status: 'planning',
        start_date: null,
        end_date: null,
        budget: null,
        client_id: null,
        assigned_team: [],
        progress: 0,
      });
      setTeamMembers([]);
      setTeamMemberInput('');
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast({
        title: 'Error',
        description: error.message || error.detail || 'Failed to save project',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{project?.id ? 'Edit Project' : 'Create New Project'}</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {project?.id ? 'Update project details below.' : 'Fill in the details to create a new project.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (₹)</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                step="0.01"
                value={formData.budget || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value ? Number(e.target.value) : null }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="progress">Progress (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData(prev => ({ ...prev, progress: Number(e.target.value) }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_id">Client</Label>
            <Select 
              value={formData.client_id || '__none__'} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value === '__none__' ? null : value }))}
              disabled={loadingClients}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingClients ? "Loading clients..." : "Select a client (optional)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No Client</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.company_name || client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_team">Assigned Team Members</Label>
            <div className="flex gap-2">
              <Input
                id="assigned_team"
                value={teamMemberInput}
                onChange={(e) => setTeamMemberInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTeamMember();
                  }
                }}
                placeholder="Enter team member name and press Enter"
              />
              <Button type="button" onClick={addTeamMember} variant="outline">
                Add
              </Button>
            </div>
            {teamMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {teamMembers.map((member, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {member}
                    <button
                      type="button"
                      onClick={() => removeTeamMember(member)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Saving...' : project?.id ? 'Update Project' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectFormDialog;