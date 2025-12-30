/**
 * Employee utility functions
 * Helper functions for employee data processing
 */

import { ROLE_CATEGORIES } from '@/utils/roleUtils';
import { Crown, Shield, Star } from 'lucide-react';

/**
 * Get role icon component
 */
export const getRoleIcon = (role: string) => {
  if (ROLE_CATEGORIES.executive.includes(role as any)) return Crown;
  if (ROLE_CATEGORIES.management.includes(role as any)) return Shield;
  return Star;
};

/**
 * Get role badge variant
 */
export const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' => {
  if (ROLE_CATEGORIES.executive.includes(role as any)) return 'default';
  if (ROLE_CATEGORIES.management.includes(role as any)) return 'secondary';
  return 'outline';
};

/**
 * Get employment type label
 */
export const getEmploymentTypeLabel = (type?: string): string => {
  switch (type) {
    case 'full_time':
    case 'full-time':
      return 'Full Time';
    case 'part_time':
    case 'part-time':
      return 'Part Time';
    case 'contract': return 'Contract';
    case 'intern': return 'Intern';
    default: return type || 'Full Time';
  }
};

/**
 * Normalize employment_type to database format (hyphens)
 */
export const normalizeEmploymentType = (type?: string): string => {
  if (!type) return 'full-time';
  // Convert underscores to hyphens (replace all occurrences)
  return type.replace(/_/g, '-');
};

/**
 * Get initials from name
 */
export const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

/**
 * Calculate employee statistics
 */
export const calculateEmployeeStats = (employees: any[]) => {
  return {
    total: employees.length,
    active: employees.filter(e => e.is_active).length,
    inactive: employees.filter(e => !e.is_active).length,
    admins: employees.filter(e => e.is_active && ['super_admin', 'admin'].includes(e.role)).length,
    managers: employees.filter(e => e.is_active && ROLE_CATEGORIES.management.includes(e.role as any)).length,
    departments: new Set(employees.map(e => e.department).filter(Boolean)).size,
  };
};

