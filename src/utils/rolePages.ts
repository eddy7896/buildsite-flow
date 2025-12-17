// Role-based page mapping - defines which pages are available to each role
import { AppRole } from './roleUtils';

export interface PageConfig {
  path: string;
  title: string;
  icon: string;
  description?: string;
  exists: boolean; // Whether the page actually exists or is a placeholder
  category: 'dashboard' | 'management' | 'finance' | 'hr' | 'projects' | 'reports' | 'personal' | 'settings' | 'system';
}

export const ROLE_PAGES: Record<AppRole, PageConfig[]> = {
  // Super Admin - Full system access
  super_admin: [
    { path: '/system', title: 'System Dashboard', icon: 'Monitor', exists: true, category: 'system' },
    { path: '/dashboard', title: 'Main Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'Employee Management', icon: 'Users', exists: true, category: 'management' },
    { path: '/employee-performance', title: 'Employee Performance', icon: 'BarChart3', exists: true, category: 'hr' },
    { path: '/role-requests', title: 'Role Requests', icon: 'UserCog', exists: true, category: 'management' },
    { path: '/permissions', title: 'Permissions', icon: 'Settings2', exists: true, category: 'system' },
    { path: '/department-management', title: 'Department Management', icon: 'Building2', exists: true, category: 'management' },
    { path: '/projects', title: 'Projects', icon: 'Building', exists: true, category: 'projects' },
    { path: '/project-management', title: 'Project Management', icon: 'FolderKanban', exists: true, category: 'projects' },
    { path: '/clients', title: 'Clients', icon: 'Building2', exists: true, category: 'management' },
    { path: '/crm', title: 'CRM', icon: 'Users2', exists: true, category: 'management' },
    { path: '/attendance', title: 'Attendance', icon: 'Clock', exists: true, category: 'hr' },
    { path: '/leave-requests', title: 'Leave Requests', icon: 'ClipboardList', exists: true, category: 'hr' },
    { path: '/financial-management', title: 'Financial Management', icon: 'Calculator', exists: true, category: 'finance' },
    { path: '/payroll', title: 'Payroll', icon: 'Calculator', exists: true, category: 'finance' },
    { path: '/invoices', title: 'Invoices', icon: 'FileText', exists: true, category: 'finance' },
    { path: '/payments', title: 'Payments', icon: 'CreditCard', exists: true, category: 'finance' },
    { path: '/receipts', title: 'Receipts', icon: 'Receipt', exists: true, category: 'finance' },
    { path: '/ledger', title: 'Ledger', icon: 'BookOpen', exists: true, category: 'finance' },
    { path: '/reports', title: 'Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/analytics', title: 'Analytics', icon: 'BarChart3', exists: true, category: 'reports' },
    { path: '/centralized-reports', title: 'Centralized Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],

  // CEO - Strategic oversight
  ceo: [
    { path: '/dashboard', title: 'Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'Employee Management', icon: 'Users2', exists: true, category: 'management' },
    { path: '/employee-performance', title: 'Employee Performance', icon: 'BarChart3', exists: true, category: 'hr' },
    { path: '/reports', title: 'Strategic Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/analytics', title: 'Analytics', icon: 'BarChart3', exists: true, category: 'reports' },
    { path: '/centralized-reports', title: 'Centralized Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/financial-management', title: 'Financial Overview', icon: 'Calculator', exists: true, category: 'finance' },
    { path: '/crm', title: 'CRM', icon: 'Users2', exists: true, category: 'management' },
    { path: '/projects', title: 'Projects', icon: 'Building', exists: true, category: 'projects' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],

  // CTO - Technology focus
  cto: [
    { path: '/dashboard', title: 'Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'Employee Management', icon: 'Users2', exists: true, category: 'management' },
    { path: '/projects', title: 'Projects', icon: 'Building', exists: true, category: 'projects' },
    { path: '/project-management', title: 'Project Management', icon: 'FolderKanban', exists: true, category: 'projects' },
    { path: '/reports', title: 'Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/analytics', title: 'Analytics', icon: 'BarChart3', exists: true, category: 'reports' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],

  // CFO - Financial oversight
  cfo: [
    { path: '/dashboard', title: 'Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'Employee Management', icon: 'Users2', exists: true, category: 'management' },
    { path: '/employee-performance', title: 'Employee Performance', icon: 'BarChart3', exists: true, category: 'hr' },
    { path: '/financial-management', title: 'Financial Management', icon: 'Calculator', exists: true, category: 'finance' },
    { path: '/payroll', title: 'Payroll', icon: 'Calculator', exists: true, category: 'finance' },
    { path: '/invoices', title: 'Invoices', icon: 'FileText', exists: true, category: 'finance' },
    { path: '/payments', title: 'Payments', icon: 'CreditCard', exists: true, category: 'finance' },
    { path: '/receipts', title: 'Receipts', icon: 'Receipt', exists: true, category: 'finance' },
    { path: '/ledger', title: 'Ledger', icon: 'BookOpen', exists: true, category: 'finance' },
    { path: '/gst-compliance', title: 'GST Compliance', icon: 'FileText', exists: true, category: 'finance' },
    { path: '/reports', title: 'Financial Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/centralized-reports', title: 'Centralized Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/analytics', title: 'Analytics', icon: 'BarChart3', exists: true, category: 'reports' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],

  // COO - Operations oversight
  coo: [
    { path: '/dashboard', title: 'Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'Employee Management', icon: 'Users2', exists: true, category: 'management' },
    { path: '/employee-performance', title: 'Employee Performance', icon: 'BarChart3', exists: true, category: 'hr' },
    { path: '/attendance', title: 'Attendance', icon: 'Clock', exists: true, category: 'hr' },
    { path: '/projects', title: 'Projects', icon: 'Building', exists: true, category: 'projects' },
    { path: '/project-management', title: 'Project Management', icon: 'FolderKanban', exists: true, category: 'projects' },
    { path: '/reports', title: 'Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/analytics', title: 'Analytics', icon: 'BarChart3', exists: true, category: 'reports' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],

  // Admin - Full operational access
  admin: [
    { path: '/dashboard', title: 'Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'Employee Management', icon: 'Users2', exists: true, category: 'management' },
    { path: '/create-employee', title: 'Create Employee', icon: 'UserPlus', exists: true, category: 'management' },
    { path: '/department-management', title: 'Department Management', icon: 'Building2', exists: true, category: 'management' },
    { path: '/calendar', title: 'Calendar', icon: 'Calendar', exists: true, category: 'hr' },
    { path: '/holiday-management', title: 'Holiday Management', icon: 'CalendarDays', exists: true, category: 'hr' },
    { path: '/crm', title: 'CRM', icon: 'Users2', exists: true, category: 'management' },
    { path: '/clients', title: 'Clients', icon: 'Building2', exists: true, category: 'management' },
    { path: '/projects', title: 'Projects', icon: 'Building', exists: true, category: 'projects' },
    { path: '/project-management', title: 'Project Management', icon: 'FolderKanban', exists: true, category: 'projects' },
    { path: '/attendance', title: 'Attendance', icon: 'Clock', exists: true, category: 'hr' },
    { path: '/leave-requests', title: 'Leave Requests', icon: 'ClipboardList', exists: true, category: 'hr' },
    { path: '/quotations', title: 'Quotations', icon: 'FileCheck', exists: true, category: 'finance' },
    { path: '/financial-management', title: 'Financial Management', icon: 'Calculator', exists: true, category: 'finance' },
    { path: '/payroll', title: 'Payroll', icon: 'Calculator', exists: true, category: 'finance' },
    { path: '/invoices', title: 'Invoices', icon: 'FileText', exists: true, category: 'finance' },
    { path: '/payments', title: 'Payments', icon: 'CreditCard', exists: true, category: 'finance' },
    { path: '/receipts', title: 'Receipts', icon: 'Receipt', exists: true, category: 'finance' },
    { path: '/reimbursements', title: 'Reimbursements', icon: 'DollarSign', exists: true, category: 'finance' },
    { path: '/ledger', title: 'Ledger', icon: 'BookOpen', exists: true, category: 'finance' },
    { path: '/gst-compliance', title: 'GST Compliance', icon: 'FileText', exists: true, category: 'finance' },
    { path: '/jobs', title: 'Job Costing', icon: 'Briefcase', exists: true, category: 'finance' },
    { path: '/centralized-reports', title: 'Centralized Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/reports', title: 'Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/analytics', title: 'Analytics', icon: 'BarChart3', exists: true, category: 'reports' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/my-attendance', title: 'My Attendance', icon: 'Clock', exists: true, category: 'personal' },
    { path: '/my-leave', title: 'My Leave', icon: 'Calendar', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],

  // Operations Manager
  operations_manager: [
    { path: '/dashboard', title: 'Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'Employee Management', icon: 'Users2', exists: true, category: 'management' },
    { path: '/employee-performance', title: 'Employee Performance', icon: 'BarChart3', exists: true, category: 'hr' },
    { path: '/project-management', title: 'Project Management', icon: 'FolderKanban', exists: true, category: 'projects' },
    { path: '/projects', title: 'Projects', icon: 'Building', exists: true, category: 'projects' },
    { path: '/attendance', title: 'Attendance', icon: 'Clock', exists: true, category: 'hr' },
    { path: '/reports', title: 'Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/my-attendance', title: 'My Attendance', icon: 'Clock', exists: true, category: 'personal' },
    { path: '/my-leave', title: 'My Leave', icon: 'Calendar', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],

  // Department Head
  department_head: [
    { path: '/dashboard', title: 'Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'Employee Management', icon: 'Users2', exists: true, category: 'management' },
    { path: '/employee-performance', title: 'Employee Performance', icon: 'BarChart3', exists: true, category: 'hr' },
    { path: '/project-management', title: 'Project Management', icon: 'FolderKanban', exists: true, category: 'projects' },
    { path: '/projects', title: 'Projects', icon: 'Building', exists: true, category: 'projects' },
    { path: '/attendance', title: 'Attendance', icon: 'Clock', exists: true, category: 'hr' },
    { path: '/leave-requests', title: 'Leave Requests', icon: 'ClipboardList', exists: true, category: 'hr' },
    { path: '/reports', title: 'Department Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/my-attendance', title: 'My Attendance', icon: 'Clock', exists: true, category: 'personal' },
    { path: '/my-leave', title: 'My Leave', icon: 'Calendar', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],

  // Team Lead
  team_lead: [
    { path: '/dashboard', title: 'Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'My Team', icon: 'Users2', exists: true, category: 'management' },
    { path: '/employee-performance', title: 'Employee Performance', icon: 'BarChart3', exists: true, category: 'hr' },
    { path: '/project-management', title: 'Project Management', icon: 'FolderKanban', exists: true, category: 'projects' },
    { path: '/projects', title: 'Projects', icon: 'Building', exists: true, category: 'projects' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/my-attendance', title: 'My Attendance', icon: 'Clock', exists: true, category: 'personal' },
    { path: '/my-leave', title: 'My Leave', icon: 'Calendar', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],

  // Project Manager
  project_manager: [
    { path: '/dashboard', title: 'Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'Team Members', icon: 'Users2', exists: true, category: 'management' },
    { path: '/employee-performance', title: 'Employee Performance', icon: 'BarChart3', exists: true, category: 'hr' },
    { path: '/project-management', title: 'Project Management', icon: 'FolderKanban', exists: true, category: 'projects' },
    { path: '/projects', title: 'Projects', icon: 'Building', exists: true, category: 'projects' },
    { path: '/clients', title: 'Clients', icon: 'Building2', exists: true, category: 'management' },
    { path: '/reports', title: 'Project Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/my-attendance', title: 'My Attendance', icon: 'Clock', exists: true, category: 'personal' },
    { path: '/my-leave', title: 'My Leave', icon: 'Calendar', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],

  // HR Manager
  hr: [
    { path: '/dashboard', title: 'Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'Employee Management', icon: 'Users2', exists: true, category: 'management' },
    { path: '/employee-performance', title: 'Employee Performance', icon: 'BarChart3', exists: true, category: 'hr' },
    { path: '/create-employee', title: 'Create Employee', icon: 'UserPlus', exists: true, category: 'management' },
    { path: '/calendar', title: 'Calendar', icon: 'Calendar', exists: true, category: 'hr' },
    { path: '/holiday-management', title: 'Holiday Management', icon: 'CalendarDays', exists: true, category: 'hr' },
    { path: '/department-management', title: 'Department Management', icon: 'Building2', exists: true, category: 'management' },
    { path: '/crm', title: 'CRM', icon: 'Users2', exists: true, category: 'management' },
    { path: '/attendance', title: 'Attendance', icon: 'Clock', exists: true, category: 'hr' },
    { path: '/leave-requests', title: 'Leave Requests', icon: 'ClipboardList', exists: true, category: 'hr' },
    { path: '/role-requests', title: 'Role Requests', icon: 'UserCog', exists: true, category: 'hr' },
    { path: '/reimbursements', title: 'Reimbursements', icon: 'DollarSign', exists: true, category: 'finance' },
    { path: '/reports', title: 'HR Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/permissions', title: 'Permissions', icon: 'Settings2', exists: true, category: 'settings' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/my-attendance', title: 'My Attendance', icon: 'Clock', exists: true, category: 'personal' },
    { path: '/my-leave', title: 'My Leave', icon: 'Calendar', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],

  // Finance Manager
  finance_manager: [
    { path: '/dashboard', title: 'Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'Employee Management', icon: 'Users2', exists: true, category: 'management' },
    { path: '/clients', title: 'Clients', icon: 'Building2', exists: true, category: 'management' },
    { path: '/payroll', title: 'Payroll', icon: 'Calculator', exists: true, category: 'finance' },
    { path: '/invoices', title: 'Invoices', icon: 'FileText', exists: true, category: 'finance' },
    { path: '/payments', title: 'Payments', icon: 'CreditCard', exists: true, category: 'finance' },
    { path: '/receipts', title: 'Receipts', icon: 'Receipt', exists: true, category: 'finance' },
    { path: '/quotations', title: 'Quotations', icon: 'FileCheck', exists: true, category: 'finance' },
    { path: '/reimbursements', title: 'Reimbursements', icon: 'DollarSign', exists: true, category: 'finance' },
    { path: '/financial-management', title: 'Financial Management', icon: 'Calculator', exists: true, category: 'finance' },
    { path: '/ledger', title: 'Ledger', icon: 'BookOpen', exists: true, category: 'finance' },
    { path: '/gst-compliance', title: 'GST Compliance', icon: 'FileText', exists: true, category: 'finance' },
    { path: '/reports', title: 'Financial Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/my-attendance', title: 'My Attendance', icon: 'Clock', exists: true, category: 'personal' },
    { path: '/my-leave', title: 'My Leave', icon: 'Calendar', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],

  // Sales Manager
  sales_manager: [
    { path: '/dashboard', title: 'Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'My Team', icon: 'Users2', exists: true, category: 'management' },
    { path: '/project-management', title: 'Project Management', icon: 'FolderKanban', exists: true, category: 'projects' },
    { path: '/crm', title: 'CRM', icon: 'Users2', exists: true, category: 'management' },
    { path: '/clients', title: 'Clients', icon: 'Building2', exists: true, category: 'management' },
    { path: '/quotations', title: 'Quotations', icon: 'FileCheck', exists: true, category: 'finance' },
    { path: '/reports', title: 'Sales Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/my-attendance', title: 'My Attendance', icon: 'Clock', exists: true, category: 'personal' },
    { path: '/my-leave', title: 'My Leave', icon: 'Calendar', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],

  // Marketing Manager
  marketing_manager: [
    { path: '/dashboard', title: 'Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'Employee Management', icon: 'Users2', exists: true, category: 'management' },
    { path: '/project-management', title: 'Project Management', icon: 'FolderKanban', exists: true, category: 'projects' },
    { path: '/crm', title: 'CRM', icon: 'Users2', exists: true, category: 'management' },
    { path: '/clients', title: 'Clients', icon: 'Building2', exists: true, category: 'management' },
    { path: '/reports', title: 'Marketing Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/analytics', title: 'Analytics', icon: 'BarChart3', exists: true, category: 'reports' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/my-attendance', title: 'My Attendance', icon: 'Clock', exists: true, category: 'personal' },
    { path: '/my-leave', title: 'My Leave', icon: 'Calendar', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],

  // Quality Assurance
  quality_assurance: [
    { path: '/dashboard', title: 'Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'Employee Management', icon: 'Users2', exists: true, category: 'management' },
    { path: '/projects', title: 'Projects', icon: 'Building', exists: true, category: 'projects' },
    { path: '/reports', title: 'QA Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/my-attendance', title: 'My Attendance', icon: 'Clock', exists: true, category: 'personal' },
    { path: '/my-leave', title: 'My Leave', icon: 'Calendar', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],

  // IT Support
  it_support: [
    { path: '/dashboard', title: 'Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'Employee Management', icon: 'Users2', exists: true, category: 'management' },
    { path: '/reports', title: 'IT Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/my-attendance', title: 'My Attendance', icon: 'Clock', exists: true, category: 'personal' },
    { path: '/my-leave', title: 'My Leave', icon: 'Calendar', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],

  // Legal Counsel
  legal_counsel: [
    { path: '/dashboard', title: 'Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'Employee Management', icon: 'Users2', exists: true, category: 'management' },
    { path: '/clients', title: 'Clients', icon: 'Building2', exists: true, category: 'management' },
    { path: '/reports', title: 'Legal Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/my-attendance', title: 'My Attendance', icon: 'Clock', exists: true, category: 'personal' },
    { path: '/my-leave', title: 'My Leave', icon: 'Calendar', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],

  // Business Analyst
  business_analyst: [
    { path: '/dashboard', title: 'Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'Employee Management', icon: 'Users2', exists: true, category: 'management' },
    { path: '/projects', title: 'Projects', icon: 'Building', exists: true, category: 'projects' },
    { path: '/reports', title: 'Analytics Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/analytics', title: 'Analytics', icon: 'BarChart3', exists: true, category: 'reports' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/my-attendance', title: 'My Attendance', icon: 'Clock', exists: true, category: 'personal' },
    { path: '/my-leave', title: 'My Leave', icon: 'Calendar', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],

  // Customer Success
  customer_success: [
    { path: '/dashboard', title: 'Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'Employee Management', icon: 'Users2', exists: true, category: 'management' },
    { path: '/clients', title: 'Clients', icon: 'Building2', exists: true, category: 'management' },
    { path: '/projects', title: 'Projects', icon: 'Building', exists: true, category: 'projects' },
    { path: '/crm', title: 'CRM', icon: 'Users2', exists: true, category: 'management' },
    { path: '/reports', title: 'Customer Reports', icon: 'ChartLine', exists: true, category: 'reports' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/my-attendance', title: 'My Attendance', icon: 'Clock', exists: true, category: 'personal' },
    { path: '/my-leave', title: 'My Leave', icon: 'Calendar', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],

  // Employee - General staff
  employee: [
    { path: '/dashboard', title: 'Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'My Team', icon: 'Users2', exists: true, category: 'management' },
    { path: '/employee-performance', title: 'My Performance', icon: 'BarChart3', exists: true, category: 'personal' },
    { path: '/my-projects', title: 'My Projects', icon: 'Briefcase', exists: true, category: 'projects' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/my-attendance', title: 'My Attendance', icon: 'Clock', exists: true, category: 'personal' },
    { path: '/my-leave', title: 'My Leave', icon: 'Calendar', exists: true, category: 'personal' },
    { path: '/reimbursements', title: 'My Reimbursements', icon: 'DollarSign', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],

  // Contractor
  contractor: [
    { path: '/dashboard', title: 'Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'My Team', icon: 'Users2', exists: true, category: 'management' },
    { path: '/employee-performance', title: 'My Performance', icon: 'BarChart3', exists: true, category: 'personal' },
    { path: '/my-projects', title: 'My Projects', icon: 'Briefcase', exists: true, category: 'projects' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/my-attendance', title: 'My Attendance', icon: 'Clock', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],

  // Intern
  intern: [
    { path: '/dashboard', title: 'Dashboard', icon: 'BarChart3', exists: true, category: 'dashboard' },
    { path: '/employee-management', title: 'My Team', icon: 'Users2', exists: true, category: 'management' },
    { path: '/employee-performance', title: 'My Performance', icon: 'BarChart3', exists: true, category: 'personal' },
    { path: '/my-projects', title: 'My Projects', icon: 'Briefcase', exists: true, category: 'projects' },
    { path: '/my-profile', title: 'My Profile', icon: 'User', exists: true, category: 'personal' },
    { path: '/my-attendance', title: 'My Attendance', icon: 'Clock', exists: true, category: 'personal' },
    { path: '/settings', title: 'Settings', icon: 'Settings', exists: true, category: 'settings' },
  ],
};

/**
 * Get pages available for a specific role
 */
export function getPagesForRole(role: AppRole): PageConfig[] {
  return ROLE_PAGES[role] || ROLE_PAGES.employee;
}

/**
 * Get pages by category for a role
 */
export function getPagesByCategory(role: AppRole): Record<string, PageConfig[]> {
  const pages = getPagesForRole(role);
  const categorized: Record<string, PageConfig[]> = {};
  
  pages.forEach(page => {
    if (!categorized[page.category]) {
      categorized[page.category] = [];
    }
    categorized[page.category].push(page);
  });
  
  return categorized;
}

/**
 * Check if a page exists for a role
 */
export function hasPageAccess(role: AppRole, path: string): boolean {
  const pages = getPagesForRole(role);
  return pages.some(page => page.path === path);
}
