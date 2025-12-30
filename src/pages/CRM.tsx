/**
 * CRM Page
 * Customer Relationship Management interface
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LeadFormDialog from '@/components/LeadFormDialog';
import ActivityFormDialog from '@/components/ActivityFormDialog';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import ConvertLeadToClientDialog from '@/components/ConvertLeadToClientDialog';
import { PipelineBoard } from '@/components/crm/PipelineBoard';

// Hooks
import { useLeads } from './crm/hooks/useLeads';
import { useActivities } from './crm/hooks/useActivities';
import { useLeadActions } from './crm/hooks/useLeadActions';
import { useActivityActions } from './crm/hooks/useActivityActions';
import { useCRMFilters } from './crm/hooks/useCRMFilters';

// Components
import { CRMMetrics } from './crm/components/CRMMetrics';
import { CRMFilters } from './crm/components/CRMFilters';
import { LeadsTab } from './crm/components/LeadsTab';
import { ActivitiesTab } from './crm/components/ActivitiesTab';
import { ReportsTab } from './crm/components/ReportsTab';

// Utils
import { calculateCRMStats, filterLeads } from './crm/utils/crmUtils';

const CRM = () => {
  const navigate = useNavigate();
  const { leads, loading, fetchLeads } = useLeads();
  const { activities, loading: activitiesLoading, fetchActivities } = useActivities();
  const filters = useCRMFilters();
  
  const leadActions = useLeadActions(fetchLeads);
  const activityActions = useActivityActions(fetchActivities);

  // Initial data load
  useEffect(() => {
    fetchLeads();
    fetchActivities();
  }, [fetchLeads, fetchActivities]);

  // Calculate stats
  const crmStats = calculateCRMStats(leads);

  // Filter leads
  const filteredLeads = filterLeads(leads, filters.searchTerm, filters.statusFilter, filters.priorityFilter);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">CRM</h1>
          <p className="text-sm lg:text-base text-muted-foreground">Manage customer relationships and sales pipeline</p>
        </div>
        <Button onClick={leadActions.handleNewLead} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Lead
        </Button>
      </div>

      <CRMMetrics
        totalLeads={crmStats.totalLeads}
        activeLeads={crmStats.activeLeads}
        conversionRate={crmStats.conversionRate}
        pipelineValue={crmStats.pipelineValue}
      />

      <CRMFilters
        searchTerm={filters.searchTerm}
        onSearchChange={filters.setSearchTerm}
        statusFilter={filters.statusFilter}
        onStatusFilterChange={filters.setStatusFilter}
        priorityFilter={filters.priorityFilter}
        onPriorityFilterChange={filters.setPriorityFilter}
      />

      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="leads" className="space-y-4">
          <LeadsTab
            leads={filteredLeads}
            loading={loading}
            onEditLead={leadActions.handleEditLead}
            onDeleteLead={leadActions.handleDeleteLead}
            onNewActivity={activityActions.handleNewActivity}
            onConvertToClient={leadActions.handleConvertToClient}
            onCreateQuotation={leadActions.handleCreateQuotation}
          />
        </TabsContent>
        
        <TabsContent value="activities" className="space-y-4">
          <ActivitiesTab
            activities={activities}
            loading={activitiesLoading}
            onNewActivity={activityActions.handleNewActivity}
            onEditActivity={activityActions.handleEditActivity}
            onDeleteActivity={activityActions.handleDeleteActivity}
          />
        </TabsContent>
        
        <TabsContent value="pipeline" className="space-y-4">
          <PipelineBoard
            onLeadClick={(lead) => navigate(`/crm/leads/${lead.id}`)}
            onLeadEdit={leadActions.handleEditLead}
            onLeadDelete={leadActions.handleDeleteLead}
            onLeadConvert={leadActions.handleConvertToClient}
            onScheduleActivity={(lead) => activityActions.handleNewActivity(lead.id)}
            onAddLead={leadActions.handleNewLead}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportsTab
            leads={leads}
            activities={activities}
            loading={loading}
            activitiesLoading={activitiesLoading}
          />
        </TabsContent>
      </Tabs>

      <LeadFormDialog
        isOpen={leadActions.leadFormOpen}
        onClose={() => leadActions.setLeadFormOpen(false)}
        lead={leadActions.selectedLead}
        onLeadSaved={leadActions.handleLeadSaved}
      />

      <ActivityFormDialog
        isOpen={activityActions.activityFormOpen}
        onClose={() => {
          activityActions.setActivityFormOpen(false);
          activityActions.setSelectedActivity(null);
        }}
        activity={activityActions.selectedActivity}
        leadId={activityActions.selectedActivity?.lead_id}
        onActivitySaved={activityActions.handleActivitySaved}
      />

      <DeleteConfirmDialog
        isOpen={leadActions.deleteDialogOpen}
        onClose={() => leadActions.setDeleteDialogOpen(false)}
        onDeleted={leadActions.handleLeadDeleted}
        itemType="Lead"
        itemName={leadActions.leadToDelete?.company_name || ''}
        itemId={leadActions.leadToDelete?.id || ''}
        tableName="leads"
      />

      <DeleteConfirmDialog
        isOpen={activityActions.deleteDialogOpen}
        onClose={() => activityActions.setDeleteDialogOpen(false)}
        onDeleted={activityActions.handleActivityDeleted}
        itemType="Activity"
        itemName={activityActions.activityToDelete?.subject || ''}
        itemId={activityActions.activityToDelete?.id || ''}
        tableName="crm_activities"
      />

      <ConvertLeadToClientDialog
        isOpen={leadActions.convertDialogOpen}
        onClose={() => {
          leadActions.setConvertDialogOpen(false);
          leadActions.setLeadToConvert(null);
        }}
        lead={leadActions.leadToConvert}
        onConverted={leadActions.handleLeadConverted}
      />
    </div>
  );
};

export default CRM;
