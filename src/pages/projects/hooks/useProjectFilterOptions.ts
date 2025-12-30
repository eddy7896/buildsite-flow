/**
 * Hook for fetching filter options (clients, employees, departments)
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { selectRecords } from '@/services/api/postgresql-service';
import { getAgencyId } from '@/utils/agencyUtils';
import { getEmployeesForAssignmentAuto } from '@/services/api/employee-selector-service';

export const useProjectFilterOptions = () => {
  const { user, profile } = useAuth();
  const [clients, setClients] = useState<Array<{ id: string; name: string; company_name: string | null }>>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; full_name: string }>>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const agencyId = await getAgencyId(profile, user?.id);
        if (!agencyId) return;

        const [clientsData, employeesData, departmentsData] = await Promise.all([
          selectRecords('clients', {
            where: { agency_id: agencyId, is_active: true },
            orderBy: 'name ASC'
          }),
          getEmployeesForAssignmentAuto(profile, user?.id).catch(() => []),
          selectRecords('departments', {
            filters: [
              { column: 'is_active', operator: 'eq', value: true }
            ],
            orderBy: 'name ASC'
          }).catch(() => [])
        ]);

        setClients(clientsData.map((c: any) => ({
          id: c.id,
          name: c.name,
          company_name: c.company_name
        })));

        setEmployees(employeesData.map((e: any) => ({
          id: e.user_id,
          full_name: e.full_name
        })));

        setDepartments(departmentsData.map((d: any) => ({
          id: d.id,
          name: d.name
        })));
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    fetchFilterOptions();
  }, [user?.id, profile]);

  return {
    clients,
    employees,
    departments,
  };
};

