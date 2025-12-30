/**
 * Hook for fetching project integration data (client, team, departments, invoices)
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Project } from '@/services/api/project-service';
import { selectRecords } from '@/services/api/postgresql-service';
import { getAgencyId } from '@/utils/agencyUtils';
import { getEmployeesForAssignmentAuto } from '@/services/api/employee-selector-service';
import { getClientById } from '@/services/api/client-selector-service';
import { getDepartmentsForSelectionAuto } from '@/services/api/department-selector-service';

export const useProjectIntegration = (project: Project | null) => {
  const { user, profile } = useAuth();
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const loadIntegrationData = useCallback(async () => {
    if (!project) return;
    
    setLoading(true);
    try {
      const agencyId = await getAgencyId(profile, user?.id);
      if (!agencyId) return;

      // Load client details
      if (project.client_id) {
        try {
          const client = await getClientById(project.client_id, agencyId);
          setClientDetails(client);
        } catch (error) {
          console.error('Error loading client details:', error);
        }
      }

      // Load team member details
      if (project.assigned_team && Array.isArray(project.assigned_team) && project.assigned_team.length > 0) {
        try {
          const allEmployees = await getEmployeesForAssignmentAuto(profile, user?.id);
          const teamMemberIds = project.assigned_team.map((m: any) => 
            typeof m === 'string' ? m : m.user_id || m.id || String(m)
          );
          const members = allEmployees.filter(emp => teamMemberIds.includes(emp.user_id));
          setTeamMembers(members);
        } catch (error) {
          console.error('Error loading team members:', error);
        }
      }

      // Load department details
      if (project.departments && Array.isArray(project.departments) && project.departments.length > 0) {
        try {
          const allDepartments = await getDepartmentsForSelectionAuto(profile, user?.id);
          const projectDepts = allDepartments.filter(dept => 
            project.departments.includes(dept.id)
          );
          setDepartments(projectDepts);
        } catch (error) {
          console.error('Error loading departments:', error);
        }
      }

      // Load related invoices
      try {
        const projectInvoices = await selectRecords('invoices', {
          filters: [
            { column: 'agency_id', operator: 'eq', value: agencyId },
            { column: 'client_id', operator: 'eq', value: project.client_id || '' }
          ],
          orderBy: 'issue_date DESC',
          limit: 10
        });
        setInvoices(projectInvoices || []);
        
        // Calculate revenue from paid invoices
        const paidInvoices = (projectInvoices || []).filter((inv: any) => 
          inv.status === 'paid' || inv.status === 'partial'
        );
        const totalRevenue = paidInvoices.reduce((sum: number, inv: any) => {
          return sum + (parseFloat(inv.total_amount) || 0);
        }, 0);
        setRevenue(totalRevenue);
      } catch (error) {
        console.error('Error loading invoices:', error);
      }
    } catch (error: any) {
      console.error('Error loading integration data:', error);
    } finally {
      setLoading(false);
    }
  }, [project, profile, user?.id]);

  return {
    clientDetails,
    teamMembers,
    departments,
    invoices,
    revenue,
    loading,
    loadIntegrationData,
  };
};

