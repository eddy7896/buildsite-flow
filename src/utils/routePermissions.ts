/**
 * Route Permissions - Single Source of Truth
 * 
 * This file defines the exact role requirements for each route in the application.
 * It ensures consistency between:
 * - Route protection in App.tsx
 * - Sidebar navigation in AppSidebar.tsx
 * - Role-to-page mappings in rolePages.ts
 * 
 * IMPORTANT: When adding or modifying routes, update this file first,
 * then update App.tsx and rolePages.ts to match.
 */

import { AppRole, hasRoleOrHigher } from './roleUtils';

/**
 * Route permission configuration
 * Maps route paths to required roles
 */
export interface RoutePermission {
  path: string;
  requiredRoles: AppRole[]; // Empty array means all authenticated users can access
  allowHigherRoles: boolean; // If true, roles higher in hierarchy can access
  description?: string;
}

/**
 * Route permissions mapping
 * This is the authoritative source for route access control
 */
export const ROUTE_PERMISSIONS: Record<string, RoutePermission> = {
  // Public routes (no authentication required)
  '/': { path: '/', requiredRoles: [], allowHigherRoles: false },
  '/pricing': { path: '/pricing', requiredRoles: [], allowHigherRoles: false },
  '/auth': { path: '/auth', requiredRoles: [], allowHigherRoles: false },
  '/agency-signup': { path: '/agency-signup', requiredRoles: [], allowHigherRoles: false },
  '/signup-success': { path: '/signup-success', requiredRoles: [], allowHigherRoles: false },
  '/forgot-password': { path: '/forgot-password', requiredRoles: [], allowHigherRoles: false },

  // Agency setup (admin only)
  '/agency-setup': { 
    path: '/agency-setup', 
    requiredRoles: ['admin'], 
    allowHigherRoles: true,
    description: 'Agency configuration and setup'
  },
  '/agency-setup-progress': { 
    path: '/agency-setup-progress', 
    requiredRoles: [], // All authenticated users during setup
    allowHigherRoles: false 
  },

  // Dashboard (all authenticated users)
  '/dashboard': { 
    path: '/dashboard', 
    requiredRoles: [], 
    allowHigherRoles: false,
    description: 'Main dashboard for all users'
  },

  // Employee Management
  '/employee-management': { 
    path: '/employee-management', 
    requiredRoles: ['admin'], 
    allowHigherRoles: true,
    description: 'Employee management and administration'
  },
  '/create-employee': { 
    path: '/create-employee', 
    requiredRoles: ['admin'], 
    allowHigherRoles: true,
    description: 'Create new employee'
  },
  '/assign-user-roles': { 
    path: '/assign-user-roles', 
    requiredRoles: ['admin'], 
    allowHigherRoles: true,
    description: 'Assign roles to users'
  },
  '/employee-performance': { 
    path: '/employee-performance', 
    requiredRoles: [], 
    allowHigherRoles: false,
    description: 'Employee performance tracking'
  },

  // Project Management
  '/project-management': { 
    path: '/project-management', 
    requiredRoles: [], 
    allowHigherRoles: false,
    description: 'Project management interface'
  },
  '/projects': { 
    path: '/projects', 
    requiredRoles: ['admin'], 
    allowHigherRoles: true,
    description: 'Projects overview (admin view)'
  },
  '/projects/:id': { 
    path: '/projects/:id', 
    requiredRoles: [], 
    allowHigherRoles: false,
    description: 'Project details'
  },
  '/tasks/:id': { 
    path: '/tasks/:id', 
    requiredRoles: [], 
    allowHigherRoles: false,
    description: 'Task details'
  },
  '/my-projects': { 
    path: '/my-projects', 
    requiredRoles: ['employee'], 
    allowHigherRoles: true,
    description: 'Employee view of assigned projects'
  },

  // Settings (all authenticated users)
  '/settings': { 
    path: '/settings', 
    requiredRoles: [], 
    allowHigherRoles: false,
    description: 'User settings'
  },

  // HR Management
  '/attendance': { 
    path: '/attendance', 
    requiredRoles: ['hr'], 
    allowHigherRoles: true,
    description: 'Attendance management (HR)'
  },
  '/leave-requests': { 
    path: '/leave-requests', 
    requiredRoles: ['hr'], 
    allowHigherRoles: true,
    description: 'Leave request management (HR)'
  },
  '/holiday-management': { 
    path: '/holiday-management', 
    requiredRoles: ['hr'], 
    allowHigherRoles: true,
    description: 'Holiday calendar management'
  },
  '/role-requests': { 
    path: '/role-requests', 
    requiredRoles: ['hr'], 
    allowHigherRoles: true,
    description: 'Role change requests'
  },
  '/calendar': { 
    path: '/calendar', 
    requiredRoles: [], 
    allowHigherRoles: false,
    description: 'Calendar view'
  },

  // Financial Management
  '/payroll': { 
    path: '/payroll', 
    requiredRoles: ['admin', 'finance_manager', 'cfo'], 
    allowHigherRoles: true,
    description: 'Payroll management'
  },
  '/invoices': { 
    path: '/invoices', 
    requiredRoles: ['admin', 'finance_manager', 'cfo'], 
    allowHigherRoles: true,
    description: 'Invoice management'
  },
  '/payments': { 
    path: '/payments', 
    requiredRoles: ['admin', 'finance_manager', 'cfo'], 
    allowHigherRoles: true,
    description: 'Payment tracking'
  },
  '/receipts': { 
    path: '/receipts', 
    requiredRoles: ['admin', 'finance_manager', 'cfo'], 
    allowHigherRoles: true,
    description: 'Receipt management'
  },
  '/ledger': { 
    path: '/ledger', 
    requiredRoles: ['admin', 'finance_manager', 'cfo'], 
    allowHigherRoles: true,
    description: 'General ledger'
  },
  '/ledger/create-entry': { 
    path: '/ledger/create-entry', 
    requiredRoles: ['admin', 'finance_manager', 'cfo'], 
    allowHigherRoles: true,
    description: 'Create journal entry'
  },
  '/financial-management': { 
    path: '/financial-management', 
    requiredRoles: ['admin', 'finance_manager', 'ceo', 'cfo'], 
    allowHigherRoles: true,
    description: 'Financial management dashboard'
  },
  '/gst-compliance': { 
    path: '/gst-compliance', 
    requiredRoles: ['admin', 'finance_manager', 'cfo'], 
    allowHigherRoles: true,
    description: 'GST compliance management'
  },
  '/quotations': { 
    path: '/quotations', 
    requiredRoles: [], 
    allowHigherRoles: false,
    description: 'Quotation management'
  },
  '/reimbursements': { 
    path: '/reimbursements', 
    requiredRoles: [], 
    allowHigherRoles: false,
    description: 'Reimbursement requests'
  },
  '/jobs': { 
    path: '/jobs', 
    requiredRoles: [], 
    allowHigherRoles: false,
    description: 'Job costing'
  },

  // Personal Pages (all authenticated users)
  '/my-profile': { 
    path: '/my-profile', 
    requiredRoles: [], 
    allowHigherRoles: false,
    description: 'User profile'
  },
  '/my-attendance': { 
    path: '/my-attendance', 
    requiredRoles: [], 
    allowHigherRoles: false,
    description: 'Personal attendance view'
  },
  '/my-leave': { 
    path: '/my-leave', 
    requiredRoles: [], 
    allowHigherRoles: false,
    description: 'Personal leave management'
  },

  // Clients & CRM
  '/clients': {
    path: '/clients',
    requiredRoles: [],
    allowHigherRoles: false,
    description: 'Client management'
  },
  '/clients/create': {
    path: '/clients/create',
    requiredRoles: ['sales_manager'],
    allowHigherRoles: true,
    description: 'Create new client'
  },
  '/clients/edit/:id': {
    path: '/clients/edit/:id',
    requiredRoles: ['sales_manager'],
    allowHigherRoles: true,
    description: 'Edit client'
  },
  '/clients-old': { 
    path: '/clients', 
    requiredRoles: [], 
    allowHigherRoles: false,
    description: 'Client management'
  },
  '/crm': { 
    path: '/crm', 
    requiredRoles: ['hr'], 
    allowHigherRoles: true,
    description: 'CRM system'
  },
  '/crm/leads/:leadId': { 
    path: '/crm/leads/:leadId', 
    requiredRoles: ['hr'], 
    allowHigherRoles: true,
    description: 'Lead details'
  },
  '/crm/activities/:activityId': { 
    path: '/crm/activities/:activityId', 
    requiredRoles: ['hr'], 
    allowHigherRoles: true,
    description: 'Activity details'
  },

  // Reports & Analytics
  '/reports': { 
    path: '/reports', 
    requiredRoles: ['admin'], 
    allowHigherRoles: true,
    description: 'Reports dashboard'
  },
  '/analytics': { 
    path: '/analytics', 
    requiredRoles: ['admin'], 
    allowHigherRoles: true,
    description: 'Analytics dashboard'
  },
  '/centralized-reports': { 
    path: '/centralized-reports', 
    requiredRoles: ['admin', 'finance_manager', 'cfo', 'ceo'], 
    allowHigherRoles: true,
    description: 'Centralized reporting'
  },

  // Department Management
  '/department-management': { 
    path: '/department-management', 
    requiredRoles: [], 
    allowHigherRoles: false,
    description: 'Department management'
  },

  // AI Features
  '/ai-features': { 
    path: '/ai-features', 
    requiredRoles: [], 
    allowHigherRoles: false,
    description: 'AI-powered features'
  },

  // Agency Management
  '/agency': { 
    path: '/agency', 
    requiredRoles: ['admin'], 
    allowHigherRoles: true,
    description: 'Agency dashboard'
  },

  // System & Super Admin
  '/system': { 
    path: '/system', 
    requiredRoles: ['super_admin'], 
    allowHigherRoles: false,
    description: 'System administration dashboard'
  },
  '/agency/:agencyId/super-admin-dashboard': { 
    path: '/agency/:agencyId/super-admin-dashboard', 
    requiredRoles: ['super_admin'], 
    allowHigherRoles: false,
    description: 'Super admin dashboard for specific agency'
  },

  // Advanced Features
  '/permissions': { 
    path: '/permissions', 
    requiredRoles: [], 
    allowHigherRoles: false,
    description: 'Advanced permissions management'
  },
  '/advanced-dashboard': { 
    path: '/advanced-dashboard', 
    requiredRoles: ['admin'], 
    allowHigherRoles: true,
    description: 'Advanced analytics dashboard'
  },
  '/documents': { 
    path: '/documents', 
    requiredRoles: [], 
    allowHigherRoles: false,
    description: 'Document management'
  },
  '/messages': { 
    path: '/messages', 
    requiredRoles: [], 
    allowHigherRoles: false,
    description: 'Message center'
  },
  '/notifications': { 
    path: '/notifications', 
    requiredRoles: [], 
    allowHigherRoles: false,
    description: 'Notifications'
  },
};

/**
 * Get required roles for a specific route path
 * Handles both exact matches and parameterized routes
 */
export function getRequiredRolesForRoute(path: string): AppRole[] {
  // Try exact match first
  if (ROUTE_PERMISSIONS[path]) {
    return ROUTE_PERMISSIONS[path].requiredRoles;
  }

  // Try to match parameterized routes
  for (const [routePath, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    // Convert route path to regex pattern
    const pattern = routePath.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    
    if (regex.test(path)) {
      return permission.requiredRoles;
    }
  }

  // Default: require authentication but no specific role
  return [];
}

/**
 * Check if a user role can access a route
 */
export function canAccessRoute(userRole: AppRole | null, routePath: string): boolean {
  if (!userRole) {
    return false;
  }

  const permission = ROUTE_PERMISSIONS[routePath];
  
  // If route not found, try parameterized matching
  let routePermission: RoutePermission | undefined = permission;
  if (!routePermission) {
    for (const [routePathPattern, perm] of Object.entries(ROUTE_PERMISSIONS)) {
      const pattern = routePathPattern.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(routePath)) {
        routePermission = perm;
        break;
      }
    }
  }

  // If still not found, default to requiring authentication (which we have)
  if (!routePermission) {
    return true; // Authenticated users can access unknown routes
  }

  // If no roles required, all authenticated users can access
  if (routePermission.requiredRoles.length === 0) {
    return true;
  }

  // Check if user's role is in the required roles
  if (routePermission.requiredRoles.includes(userRole)) {
    return true;
  }

  // Check if higher roles can access
  if (routePermission.allowHigherRoles) {
    return routePermission.requiredRoles.some(role => hasRoleOrHigher(userRole, role));
  }

  return false;
}

/**
 * Get all routes accessible by a specific role
 */
export function getAccessibleRoutes(role: AppRole): string[] {
  const accessibleRoutes: string[] = [];

  for (const [routePath, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (canAccessRoute(role, routePath)) {
      accessibleRoutes.push(routePath);
    }
  }

  return accessibleRoutes;
}

/**
 * Get route permission configuration
 * Handles both exact matches and parameterized routes
 */
export function getRoutePermission(path: string): RoutePermission | undefined {
  // Try exact match first
  if (ROUTE_PERMISSIONS[path]) {
    return ROUTE_PERMISSIONS[path];
  }

  // Try to match parameterized routes
  for (const [routePath, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    // Convert route path to regex pattern
    const pattern = routePath.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    
    if (regex.test(path)) {
      return permission;
    }
  }

  return undefined;
}
