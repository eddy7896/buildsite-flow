/**
 * Team Service
 * Handles fetching and filtering team members based on user role and relationships
 */

import { selectRecords, selectOne } from '@/services/api/postgresql-service';
import { AppRole, ROLE_CATEGORIES, ROLE_HIERARCHY } from '@/utils/roleUtils';

export interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  position: string | null;
  hire_date: string | null;
  avatar_url: string | null;
  is_active: boolean;
  role: string;
  location?: string | null;
  employee_id?: string;
  supervisor_name?: string | null;
}

interface TeamFilterOptions {
  userId: string;
  userRole: AppRole;
  userDepartmentId?: string | null;
  userDepartmentName?: string | null;
  agencyId?: string | null;
}

/**
 * Get team members for a user based on their role and relationships
 */
export async function getTeamMembers(options: TeamFilterOptions): Promise<TeamMember[]> {
  const { userId, userRole, userDepartmentId, userDepartmentName, agencyId } = options;

  try {
    // Executive roles (CEO, CTO, CFO, COO) see all employees in the agency
    if (ROLE_CATEGORIES.executive.includes(userRole)) {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<TeamMember[]>((_, reject) => {
        setTimeout(() => reject(new Error('Team fetch timeout')), 30000); // 30 second timeout
      });
      
      return await Promise.race([
        getAllAgencyEmployees(agencyId),
        timeoutPromise
      ]).catch((error) => {
        console.error('Error or timeout fetching all agency employees:', error);
        return []; // Return empty array on timeout/error
      });
    }

    // Super Admin and Admin see all employees
    if (userRole === 'super_admin' || userRole === 'admin') {
      return await getAllAgencyEmployees(agencyId);
    }

    // HR sees all employees
    if (userRole === 'hr') {
      return await getAllAgencyEmployees(agencyId);
    }

    // Department Head sees their department members
    if (userRole === 'department_head' && userDepartmentId) {
      return await getDepartmentMembers(userDepartmentId, agencyId);
    }

    // Team Lead sees their team members (direct reports via supervisor_id or team_assignments)
    if (userRole === 'team_lead') {
      return await getDirectReports(userId, userDepartmentId, agencyId);
    }

    // Project Manager sees project team members
    if (userRole === 'project_manager') {
      return await getProjectTeamMembers(userId, agencyId);
    }

    // Finance Manager sees finance team
    if (userRole === 'finance_manager') {
      return await getDepartmentMembersByRole('finance', userDepartmentId, agencyId);
    }

    // Sales Manager sees sales team
    if (userRole === 'sales_manager') {
      return await getDepartmentMembersByRole('sales', userDepartmentId, agencyId);
    }

    // Marketing Manager sees marketing team
    if (userRole === 'marketing_manager') {
      return await getDepartmentMembersByRole('marketing', userDepartmentId, agencyId);
    }

    // Operations Manager sees operations team
    if (userRole === 'operations_manager') {
      return await getDepartmentMembers(userDepartmentId, agencyId) || await getDirectReports(userId, userDepartmentId, agencyId);
    }

    // IT Support sees IT team
    if (userRole === 'it_support') {
      return await getDepartmentMembersByRole('it', userDepartmentId, agencyId);
    }

    // For other roles, get direct reports if they have any
    const directReports = await getDirectReports(userId, userDepartmentId, agencyId);
    if (directReports.length > 0) {
      return directReports;
    }

    // Fallback: If user has a department, show department members
    if (userDepartmentId) {
      return await getDepartmentMembers(userDepartmentId, agencyId);
    }

    // Last resort: return empty array
    return [];
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
}

/**
 * Get all employees in an agency
 */
async function getAllAgencyEmployees(agencyId: string | null | undefined): Promise<TeamMember[]> {
  if (!agencyId) {
    console.warn('getAllAgencyEmployees: No agencyId provided');
    return [];
  }

  try {
    // Directly fetch from profiles table (more reliable than unified_employees view)
    const profiles = await selectRecords('profiles', {
      filters: [
        { column: 'agency_id', operator: 'eq', value: agencyId },
        { column: 'is_active', operator: 'eq', value: true }
      ],
      orderBy: 'full_name ASC'
    });

    if (profiles.length === 0) {
      console.log('getAllAgencyEmployees: No profiles found for agency', agencyId);
      return [];
    }

    return await enrichTeamMembers(profiles);
  } catch (error) {
    console.error('Error fetching all agency employees:', error);
    // Return empty array on error to prevent infinite loading
    return [];
  }
}

/**
 * Get department members
 */
async function getDepartmentMembers(departmentId: string, agencyId: string | null | undefined): Promise<TeamMember[]> {
  if (!departmentId) return [];

  try {
    // Get team assignments for this department
    const teamAssignments = await selectRecords('team_assignments', {
      filters: [
        { column: 'department_id', operator: 'eq', value: departmentId },
        { column: 'is_active', operator: 'eq', value: true }
      ]
    });

    if (teamAssignments.length === 0) return [];

    const userIds = teamAssignments.map((ta: any) => ta.user_id).filter(Boolean);

    // Get profiles for these users
    const profiles = await selectRecords('profiles', {
      filters: [
        { column: 'user_id', operator: 'in', value: userIds },
        { column: 'is_active', operator: 'eq', value: true }
      ]
    });

    return await enrichTeamMembers(profiles);
  } catch (error) {
    console.error('Error fetching department members:', error);
    return [];
  }
}

/**
 * Get direct reports (people who report to this user)
 */
async function getDirectReports(supervisorUserId: string, departmentId: string | null | undefined, agencyId: string | null | undefined): Promise<TeamMember[]> {
  try {
    // First, get the employee_details.id for the supervisor
    const supervisorEmployee = await selectOne('employee_details', {
      user_id: supervisorUserId
    });

    if (!supervisorEmployee) {
      // Try team_assignments with reporting_to
      return await getDirectReportsViaTeamAssignments(supervisorUserId, agencyId);
    }

    const supervisorEmployeeId = supervisorEmployee.id;

    // Get employees who have this supervisor
    const directReports = await selectRecords('employee_details', {
      filters: [
        { column: 'supervisor_id', operator: 'eq', value: supervisorEmployeeId },
        { column: 'is_active', operator: 'eq', value: true }
      ]
    });

    if (directReports.length === 0) {
      // Fallback to team_assignments
      return await getDirectReportsViaTeamAssignments(supervisorUserId, agencyId);
    }

    const userIds = directReports.map((dr: any) => dr.user_id).filter(Boolean);

    // Get profiles for these users
    const profiles = await selectRecords('profiles', {
      filters: [
        { column: 'user_id', operator: 'in', value: userIds },
        { column: 'is_active', operator: 'eq', value: true }
      ]
    });

    return await enrichTeamMembers(profiles);
  } catch (error) {
    console.error('Error fetching direct reports:', error);
    return [];
  }
}

/**
 * Get direct reports via team_assignments.reporting_to
 */
async function getDirectReportsViaTeamAssignments(supervisorUserId: string, agencyId: string | null | undefined): Promise<TeamMember[]> {
  try {
    // Get team assignments where reporting_to matches supervisor's user_id
    const teamAssignments = await selectRecords('team_assignments', {
      filters: [
        { column: 'reporting_to', operator: 'eq', value: supervisorUserId },
        { column: 'is_active', operator: 'eq', value: true }
      ]
    });

    if (teamAssignments.length === 0) return [];

    const userIds = teamAssignments.map((ta: any) => ta.user_id).filter(Boolean);

    // Get profiles for these users
    const profiles = await selectRecords('profiles', {
      filters: [
        { column: 'user_id', operator: 'in', value: userIds },
        { column: 'is_active', operator: 'eq', value: true }
      ]
    });

    return await enrichTeamMembers(profiles);
  } catch (error) {
    console.error('Error fetching direct reports via team assignments:', error);
    return [];
  }
}

/**
 * Get project team members
 */
async function getProjectTeamMembers(projectManagerUserId: string, agencyId: string | null | undefined): Promise<TeamMember[]> {
  try {
    // Get projects where this user is the project manager
    const projects = await selectRecords('projects', {
      filters: [
        { column: 'project_manager_id', operator: 'eq', value: projectManagerUserId }
      ]
    });

    if (projects.length === 0) {
      // Fallback to direct reports
      return await getDirectReportsViaTeamAssignments(projectManagerUserId, agencyId);
    }

    const projectIds = projects.map((p: any) => p.id);

    // Get project members
    const projectMembers = await selectRecords('project_members', {
      filters: [
        { column: 'project_id', operator: 'in', value: projectIds }
      ]
    });

    if (projectMembers.length === 0) return [];

    const userIds = projectMembers.map((pm: any) => pm.user_id).filter(Boolean);

    // Get profiles for these users
    const profiles = await selectRecords('profiles', {
      filters: [
        { column: 'user_id', operator: 'in', value: userIds },
        { column: 'is_active', operator: 'eq', value: true }
      ]
    });

    return await enrichTeamMembers(profiles);
  } catch (error) {
    console.error('Error fetching project team members:', error);
    // Fallback to direct reports
    return await getDirectReportsViaTeamAssignments(projectManagerUserId, agencyId);
  }
}

/**
 * Get department members by role/department name
 */
async function getDepartmentMembersByRole(departmentType: string, departmentId: string | null | undefined, agencyId: string | null | undefined): Promise<TeamMember[]> {
  try {
    // First try by department ID if provided
    if (departmentId) {
      return await getDepartmentMembers(departmentId, agencyId);
    }

    // Otherwise, try to find department by name pattern
    const allDepartments = await selectRecords('departments', {});
    
    // Filter departments by name pattern (case-insensitive)
    const matchingDepartments = allDepartments.filter((dept: any) => 
      dept.name?.toLowerCase().includes(departmentType.toLowerCase())
    );

    if (matchingDepartments.length === 0) return [];

    // Get members from all matching departments
    const allMembers: TeamMember[] = [];
    for (const dept of matchingDepartments) {
      const members = await getDepartmentMembers(dept.id, agencyId);
      allMembers.push(...members);
    }

    // Remove duplicates
    const uniqueMembers = Array.from(
      new Map(allMembers.map(m => [m.user_id, m])).values()
    );

    return uniqueMembers;
  } catch (error) {
    console.error('Error fetching department members by role:', error);
    return [];
  }
}

/**
 * Enrich team members with additional data (roles, emails, locations, etc.)
 */
async function enrichTeamMembers(profiles: any[]): Promise<TeamMember[]> {
  if (profiles.length === 0) return [];

  const userIds = profiles.map((p: any) => p.user_id).filter(Boolean);

  if (userIds.length === 0) {
    console.warn('enrichTeamMembers: No user IDs found in profiles');
    return [];
  }

  // If too many users, fetch in batches to avoid query issues
  const BATCH_SIZE = 100;
  const batches: string[][] = [];
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    batches.push(userIds.slice(i, i + BATCH_SIZE));
  }

  try {
    // Fetch user roles (in batches if needed)
    let allRoles: any[] = [];
    for (const batch of batches) {
      const batchRoles = await selectRecords('user_roles', {
        filters: [
          { column: 'user_id', operator: 'in', value: batch }
        ]
      }).catch((error) => {
        console.warn('Error fetching user roles batch:', error);
        return [];
      });
      allRoles = [...allRoles, ...batchRoles];
    }

    // Fetch users for emails (in batches if needed)
    let allUsers: any[] = [];
    for (const batch of batches) {
      const batchUsers = await selectRecords('users', {
        filters: [
          { column: 'id', operator: 'in', value: batch }
        ],
        select: 'id, email'
      }).catch((error) => {
        console.warn('Error fetching users batch:', error);
        return [];
      });
      allUsers = [...allUsers, ...batchUsers];
    }

    // Fetch employee details for locations and employee_id (in batches if needed)
    let allEmployeeDetails: any[] = [];
    for (const batch of batches) {
      const batchDetails = await selectRecords('employee_details', {
        filters: [
          { column: 'user_id', operator: 'in', value: batch }
        ],
        select: 'user_id, work_location, employee_id, supervisor_id'
      }).catch((error) => {
        console.warn('Error fetching employee details batch:', error);
        return [];
      });
      allEmployeeDetails = [...allEmployeeDetails, ...batchDetails];
    }

    const roles = allRoles;
    const users = allUsers;
    const employeeDetails = allEmployeeDetails;

    // Create maps
    const roleMap = new Map<string, string>();
    roles.forEach((r: any) => {
      if (!roleMap.has(r.user_id)) {
        roleMap.set(r.user_id, r.role);
      }
    });

    const userMap = new Map(users.map((u: any) => [u.id, u]));
    const employeeMap = new Map(employeeDetails.map((e: any) => [e.user_id, e]));

    // Get supervisor names (skip if no supervisor IDs to avoid unnecessary queries)
    const supervisorIds = employeeDetails
      .map((e: any) => e.supervisor_id)
      .filter(Boolean);
    
    let supervisorDetails: any[] = [];
    let supervisorProfiles: any[] = [];
    
    if (supervisorIds.length > 0) {
      try {
        supervisorDetails = await selectRecords('employee_details', {
          filters: [
            { column: 'id', operator: 'in', value: supervisorIds }
          ],
          select: 'id, user_id'
        }).catch((error) => {
          console.warn('Error fetching supervisor details:', error);
          return [];
        });

        const supervisorUserIds = supervisorDetails.map((s: any) => s.user_id).filter(Boolean);
        if (supervisorUserIds.length > 0) {
          supervisorProfiles = await selectRecords('profiles', {
            filters: [
              { column: 'user_id', operator: 'in', value: supervisorUserIds }
            ],
            select: 'user_id, full_name'
          }).catch((error) => {
            console.warn('Error fetching supervisor profiles:', error);
            return [];
          });
        }
      } catch (error) {
        console.warn('Error fetching supervisor information:', error);
        // Continue without supervisor names
      }
    }

    const supervisorIdToUserId = new Map(supervisorDetails.map((s: any) => [s.id, s.user_id]));
    const supervisorUserIdToName = new Map(supervisorProfiles.map((p: any) => [p.user_id, p.full_name]));

    // Transform to TeamMember
    return profiles.map((profile: any): TeamMember => {
      const user = userMap.get(profile.user_id);
      const employee = employeeMap.get(profile.user_id);
      const role = roleMap.get(profile.user_id) || 'employee';
      
      // Get supervisor name
      let supervisorName: string | null = null;
      if (employee?.supervisor_id) {
        const supervisorUserId = supervisorIdToUserId.get(employee.supervisor_id);
        if (supervisorUserId) {
          supervisorName = supervisorUserIdToName.get(supervisorUserId) || null;
        }
      }

      return {
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name || 'Unknown User',
        email: user?.email || `${(profile.full_name || 'user').toLowerCase().replace(/\s+/g, '.')}@company.com`,
        phone: profile.phone || null,
        department: profile.department || null,
        position: profile.position || null,
        hire_date: profile.hire_date || null,
        avatar_url: profile.avatar_url || null,
        is_active: profile.is_active !== false,
        role,
        location: employee?.work_location || null,
        employee_id: employee?.employee_id || null,
        supervisor_name: supervisorName,
      };
    });
  } catch (error) {
    console.error('Error enriching team members:', error);
    // Return basic team members without enrichment on error
    return profiles.map((profile: any): TeamMember => ({
      id: profile.id,
      user_id: profile.user_id,
      full_name: profile.full_name || 'Unknown User',
      email: `${(profile.full_name || 'user').toLowerCase().replace(/\s+/g, '.')}@company.com`,
      phone: profile.phone || null,
      department: profile.department || null,
      position: profile.position || null,
      hire_date: profile.hire_date || null,
      avatar_url: profile.avatar_url || null,
      is_active: profile.is_active !== false,
      role: 'employee',
      location: null,
      employee_id: null,
      supervisor_name: null,
    }));
  }
}

