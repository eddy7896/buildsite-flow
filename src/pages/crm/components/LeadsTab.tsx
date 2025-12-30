/**
 * Leads Tab Component
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Edit, Trash2, Plus, UserCheck, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStatusColor, getPriorityColor } from '../utils/crmUtils';

interface LeadsTabProps {
  leads: any[];
  loading: boolean;
  onEditLead: (lead: any) => void;
  onDeleteLead: (lead: any) => void;
  onNewActivity: (leadId: string) => void;
  onConvertToClient: (lead: any) => void;
  onCreateQuotation: (lead: any) => void;
}

export const LeadsTab = ({
  leads,
  loading,
  onEditLead,
  onDeleteLead,
  onNewActivity,
  onConvertToClient,
  onCreateQuotation,
}: LeadsTabProps) => {
  const navigate = useNavigate();

  if (loading) {
    return <div className="text-center py-8">Loading leads...</div>;
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No leads found. Create your first lead to get started.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {leads.map((lead) => (
        <Card 
          key={lead.id} 
          className="hover:shadow-md transition-shadow cursor-pointer" 
          onClick={() => navigate(`/crm/leads/${lead.id}`)}
        >
          <CardHeader className="pb-3">
            <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
              <div className="flex-1">
                <CardTitle className="text-lg">{lead.company_name || lead.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {lead.lead_number} • {lead.contact_name || lead.name}
                </p>
              </div>
              <div className="flex gap-2 self-start">
                <Badge className={getStatusColor(lead.status)}>
                  {lead.status}
                </Badge>
                <Badge className={getPriorityColor(lead.priority || 'medium')}>
                  {lead.priority || 'medium'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Contact</p>
                <p className="font-medium">{lead.email || 'No email'}</p>
                <p className="text-sm">{lead.phone || 'No phone'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Value</p>
                <p className="font-semibold">
                  {(lead.estimated_value || lead.value)
                    ? `₹${parseFloat((lead.estimated_value || lead.value || 0).toString()).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                    : '₹0'
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  Close: {lead.expected_close_date ? new Date(lead.expected_close_date).toLocaleDateString() : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Probability</p>
                <div className="flex items-center gap-2">
                  <Progress value={lead.probability || 0} className="flex-1" />
                  <span className="text-sm font-medium">{lead.probability || 0}%</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
              <div className="text-sm text-muted-foreground">
                Created: {new Date(lead.created_at).toLocaleDateString()}
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:gap-2 sm:space-y-0" onClick={(e) => e.stopPropagation()}>
                <Button variant="outline" size="sm" onClick={() => onEditLead(lead)} className="w-full sm:w-auto">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => onNewActivity(lead.id)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Activity
                </Button>
                {lead.status !== 'won' && lead.status !== 'lost' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => onConvertToClient(lead)} className="w-full sm:w-auto">
                      <UserCheck className="h-4 w-4 mr-1" />
                      Convert
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onCreateQuotation(lead)} className="w-full sm:w-auto">
                      <FileText className="h-4 w-4 mr-1" />
                      Quote
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm" onClick={() => onDeleteLead(lead)} className="w-full sm:w-auto">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

