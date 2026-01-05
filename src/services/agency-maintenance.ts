/**
 * Agency Maintenance Service
 * API calls for agency maintenance mode management
 */

export interface MaintenanceStatus {
  maintenance_mode: boolean;
  maintenance_message: string | null;
}

export interface MaintenanceResponse {
  success: boolean;
  data: MaintenanceStatus;
  message?: string;
}

/**
 * Get current agency maintenance status
 */
export async function getAgencyMaintenanceStatus(): Promise<MaintenanceStatus> {
  const agencyDatabase = localStorage.getItem('agencyDatabase');
  if (!agencyDatabase) {
    throw new Error('Agency database not found');
  }

  const token = localStorage.getItem('token');
  const response = await fetch('/api/agencies/maintenance-status', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-agency-database': agencyDatabase,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch maintenance status');
  }

  const data: MaintenanceResponse = await response.json();
  return data.data;
}

/**
 * Toggle agency maintenance mode
 */
export async function toggleAgencyMaintenance(
  maintenanceMode: boolean,
  maintenanceMessage?: string | null
): Promise<MaintenanceStatus> {
  const agencyDatabase = localStorage.getItem('agencyDatabase');
  if (!agencyDatabase) {
    throw new Error('Agency database not found');
  }

  const token = localStorage.getItem('token');
  const response = await fetch('/api/agencies/maintenance', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-agency-database': agencyDatabase,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      maintenance_mode: maintenanceMode,
      maintenance_message: maintenanceMessage || null,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update maintenance mode');
  }

  const data: MaintenanceResponse = await response.json();
  return data.data;
}

