/**
 * CRM utility functions
 */

import { Phone, Mail, Users2, Target } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

/**
 * Get status color class
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-800';
    case 'contacted': return 'bg-yellow-100 text-yellow-800';
    case 'qualified': return 'bg-green-100 text-green-800';
    case 'proposal': return 'bg-purple-100 text-purple-800';
    case 'negotiation': return 'bg-orange-100 text-orange-800';
    case 'won': return 'bg-emerald-100 text-emerald-800';
    case 'lost': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get priority color class
 */
export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get activity icon component
 */
export const getActivityIcon = (type: string): LucideIcon => {
  switch (type) {
    case 'call': return Phone;
    case 'email': return Mail;
    case 'meeting': return Users2;
    default: return Target;
  }
};

/**
 * Pipeline stages configuration
 */
export const PIPELINE_STAGES = [
  { name: 'New', status: 'new', color: 'bg-blue-500' },
  { name: 'Contacted', status: 'contacted', color: 'bg-yellow-500' },
  { name: 'Qualified', status: 'qualified', color: 'bg-green-500' },
  { name: 'Proposal', status: 'proposal', color: 'bg-purple-500' },
  { name: 'Negotiation', status: 'negotiation', color: 'bg-orange-500' },
  { name: 'Won', status: 'won', color: 'bg-emerald-500' },
  { name: 'Lost', status: 'lost', color: 'bg-red-500' },
];

/**
 * Calculate CRM statistics
 */
export const calculateCRMStats = (leads: any[]) => {
  const totalLeads = leads.length;
  const activeLeads = leads.filter(lead => 
    ['new', 'contacted', 'qualified', 'proposal', 'negotiation'].includes(lead.status)
  ).length;
  const conversionRate = leads.length > 0 
    ? parseFloat(((leads.filter(lead => lead.status === 'won').length / leads.length) * 100).toFixed(1))
    : 0;
  const pipelineValue = leads
    .filter(lead => ['new', 'contacted', 'qualified', 'proposal', 'negotiation'].includes(lead.status))
    .reduce((sum, lead) => {
      const value = (lead.estimated_value || lead.value) 
        ? parseFloat((lead.estimated_value || lead.value || 0).toString()) 
        : 0;
      return sum + value;
    }, 0);

  return {
    totalLeads,
    activeLeads,
    conversionRate,
    pipelineValue,
  };
};

/**
 * Filter leads based on search term, status, and priority
 */
export const filterLeads = (
  leads: any[],
  searchTerm: string,
  statusFilter: string,
  priorityFilter: string
): any[] => {
  return leads.filter(lead => {
    const companyName = lead.company_name || lead.name || '';
    const contactName = lead.contact_name || lead.name || '';
    const matchesSearch = 
      companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lead_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || (lead.priority || 'medium') === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });
};

/**
 * Normalize lead data for backward compatibility
 */
export const normalizeLead = (lead: any) => ({
  ...lead,
  estimated_value: lead.estimated_value || lead.value || 0,
  contact_name: lead.contact_name || lead.name || '',
  company_name: lead.company_name || lead.name || '',
  lead_source_id: lead.lead_source_id || lead.source_id,
  notes: lead.notes || lead.description || '',
});

