/**
 * Route Groups Configuration
 * Organized by feature/module for better maintainability
 */

import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { SuspenseRoute } from "./SuspenseRoute";
import * as Pages from "./lazyImports";

/**
 * Public/Unauthenticated Routes
 */
export const PublicRoutes = () => [
  <Route key="/" path="/" element={<SuspenseRoute><Pages.Landing /></SuspenseRoute>} />,
  <Route key="/pricing" path="/pricing" element={<SuspenseRoute><Pages.Pricing /></SuspenseRoute>} />,
  <Route key="/auth" path="/auth" element={<SuspenseRoute><Pages.Auth /></SuspenseRoute>} />,
  <Route key="/agency-signup" path="/agency-signup" element={<SuspenseRoute><Pages.OnboardingWizard /></SuspenseRoute>} />,
  <Route key="/signup-success" path="/signup-success" element={<SuspenseRoute><Pages.SignupSuccess /></SuspenseRoute>} />,
  <Route key="/forgot-password" path="/forgot-password" element={<SuspenseRoute><Pages.ForgotPassword /></SuspenseRoute>} />,
  <Route key="/login" path="/login" element={<SuspenseRoute><Pages.Auth /></SuspenseRoute>} />,
  <Route key="/register" path="/register" element={<SuspenseRoute><Pages.Auth /></SuspenseRoute>} />,
];

/**
 * Static Pages Routes
 */
export const StaticPageRoutes = () => [
  <Route key="/contact" path="/contact" element={<SuspenseRoute><Pages.ContactPage /></SuspenseRoute>} />,
  <Route key="/about" path="/about" element={<SuspenseRoute><Pages.AboutPage /></SuspenseRoute>} />,
  <Route key="/blog" path="/blog" element={<SuspenseRoute><Pages.BlogPage /></SuspenseRoute>} />,
  <Route key="/careers" path="/careers" element={<SuspenseRoute><Pages.CareersPage /></SuspenseRoute>} />,
  <Route key="/help" path="/help" element={<SuspenseRoute><Pages.HelpCenterPage /></SuspenseRoute>} />,
  <Route key="/docs" path="/docs" element={<SuspenseRoute><Pages.DocsPage /></SuspenseRoute>} />,
  <Route key="/api" path="/api" element={<SuspenseRoute><Pages.APIReferencePage /></SuspenseRoute>} />,
  <Route key="/privacy" path="/privacy" element={<SuspenseRoute><Pages.PrivacyPolicyPage /></SuspenseRoute>} />,
  <Route key="/terms" path="/terms" element={<SuspenseRoute><Pages.TermsPage /></SuspenseRoute>} />,
  <Route key="/cookies" path="/cookies" element={<SuspenseRoute><Pages.CookiePolicyPage /></SuspenseRoute>} />,
  <Route key="/gdpr" path="/gdpr" element={<SuspenseRoute><Pages.GDPRPage /></SuspenseRoute>} />,
  <Route key="/changelog" path="/changelog" element={<SuspenseRoute><Pages.ChangelogPage /></SuspenseRoute>} />,
  <Route key="/roadmap" path="/roadmap" element={<SuspenseRoute><Pages.RoadmapPage /></SuspenseRoute>} />,
  <Route key="/integrations-info" path="/integrations-info" element={<SuspenseRoute><Pages.IntegrationsPublicPage /></SuspenseRoute>} />,
  <Route key="/templates" path="/templates" element={<SuspenseRoute><Pages.TemplatesPage /></SuspenseRoute>} />,
  <Route key="/community" path="/community" element={<SuspenseRoute><Pages.CommunityPage /></SuspenseRoute>} />,
  <Route key="/press" path="/press" element={<SuspenseRoute><Pages.PressPage /></SuspenseRoute>} />,
];

/**
 * Dashboard & Core Routes
 */
export const DashboardRoutes = () => [
  <Route
    key="/agency-setup"
    path="/agency-setup"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.AgencySetup /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/agency-setup-progress"
    path="/agency-setup-progress"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.AgencySetupProgress /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/dashboard"
    path="/dashboard"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.Index /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/agency"
    path="/agency"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.AgencyAdminDashboard /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/super-admin"
    path="/super-admin"
    element={
      <ProtectedRoute requiredRole="super_admin">
        <Pages.SuperAdminLayout>
          <SuspenseRoute><Pages.SuperAdminDashboardNew /></SuspenseRoute>
        </Pages.SuperAdminLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/super-admin/agencies"
    path="/super-admin/agencies"
    element={
      <ProtectedRoute requiredRole="super_admin">
        <Pages.SuperAdminLayout>
          <SuspenseRoute><Pages.AgencyManagement /></SuspenseRoute>
        </Pages.SuperAdminLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/super-admin/agencies/:agencyId/data"
    path="/super-admin/agencies/:agencyId/data"
    element={
      <ProtectedRoute requiredRole="super_admin">
        <Pages.SuperAdminLayout>
          <SuspenseRoute><Pages.AgencyDataViewer /></SuspenseRoute>
        </Pages.SuperAdminLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/super-admin/system-settings"
    path="/super-admin/system-settings"
    element={
      <ProtectedRoute requiredRole="super_admin">
        <Pages.SuperAdminLayout>
          <SuspenseRoute><Pages.SystemSettings /></SuspenseRoute>
        </Pages.SuperAdminLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/super-admin/plans"
    path="/super-admin/plans"
    element={
      <ProtectedRoute requiredRole="super_admin">
        <Pages.SuperAdminLayout>
          <SuspenseRoute><Pages.PlanManagement /></SuspenseRoute>
        </Pages.SuperAdminLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/super-admin/page-catalog"
    path="/super-admin/page-catalog"
    element={
      <ProtectedRoute requiredRole="super_admin">
        <Pages.SuperAdminLayout>
          <SuspenseRoute><Pages.PageCatalogManagement /></SuspenseRoute>
        </Pages.SuperAdminLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/super-admin/analytics"
    path="/super-admin/analytics"
    element={
      <ProtectedRoute requiredRole="super_admin">
        <Pages.SuperAdminLayout>
          <SuspenseRoute><Pages.SuperAdminAnalytics /></SuspenseRoute>
        </Pages.SuperAdminLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/system"
    path="/system"
    element={
      <ProtectedRoute requiredRole="super_admin">
        <Navigate to="/super-admin" replace />
      </ProtectedRoute>
    }
  />,
  <Route
    key="/system-health"
    path="/system-health"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.SystemHealth /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
];

/**
 * Employee Management Routes
 */
export const EmployeeRoutes = () => [
  <Route
    key="/employee-management"
    path="/employee-management"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.EmployeeManagement /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route key="/my-team" path="/my-team" element={<Navigate to="/employee-management" replace />} />,
  <Route key="/users" path="/users" element={<Navigate to="/employee-management" replace />} />,
  <Route key="/employees" path="/employees" element={<Navigate to="/employee-management" replace />} />,
  <Route
    key="/create-employee"
    path="/create-employee"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.CreateEmployee /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/assign-user-roles"
    path="/assign-user-roles"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.AssignUserRoles /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/my-projects"
    path="/my-projects"
    element={
      <ProtectedRoute requiredRole="employee">
        <DashboardLayout>
          <SuspenseRoute><Pages.EmployeeProjects /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/employee-performance"
    path="/employee-performance"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.EmployeePerformance /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/my-profile"
    path="/my-profile"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.MyProfile /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/my-attendance"
    path="/my-attendance"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.MyAttendance /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/my-leave"
    path="/my-leave"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.MyLeave /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
];

/**
 * Project Management Routes
 */
export const ProjectRoutes = () => [
  <Route
    key="/project-management"
    path="/project-management"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.ProjectManagement /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/projects/:id"
    path="/projects/:id"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.ProjectDetails /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/tasks/:id"
    path="/tasks/:id"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.TaskDetails /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/projects"
    path="/projects"
    element={
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout>
          <SuspenseRoute><Pages.Projects /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
];

/**
 * HR & Attendance Routes
 */
export const HRRoutes = () => [
  <Route
    key="/attendance"
    path="/attendance"
    element={
      <ProtectedRoute requiredRole={["hr", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.Attendance /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/leave-requests"
    path="/leave-requests"
    element={
      <ProtectedRoute requiredRole="hr">
        <DashboardLayout>
          <SuspenseRoute><Pages.LeaveRequests /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/holiday-management"
    path="/holiday-management"
    element={
      <ProtectedRoute requiredRole={["hr", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.HolidayManagement /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
];

/**
 * Financial Management Routes
 */
export const FinancialRoutes = () => [
  <Route
    key="/payroll"
    path="/payroll"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin", "finance_manager", "cfo"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.Payroll /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/invoices"
    path="/invoices"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin", "finance_manager", "cfo"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.Invoices /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/payments"
    path="/payments"
    element={
      <ProtectedRoute requiredRole={["admin", "finance_manager", "cfo"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.Payments /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/receipts"
    path="/receipts"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin", "finance_manager", "cfo"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.Receipts /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/ledger"
    path="/ledger"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin", "finance_manager", "cfo"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.Ledger /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/ledger/create-entry"
    path="/ledger/create-entry"
    element={
      <ProtectedRoute requiredRole={["admin", "finance_manager", "cfo"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.CreateJournalEntry /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/financial-management"
    path="/financial-management"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin", "finance_manager", "ceo", "cfo"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.FinancialManagement /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/gst-compliance"
    path="/gst-compliance"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin", "finance_manager", "cfo"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.GstCompliance /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/reimbursements"
    path="/reimbursements"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.Reimbursements /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
];

/**
 * Clients & CRM Routes
 */
export const ClientRoutes = () => [
  <Route
    key="/clients"
    path="/clients"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.Clients /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/clients/create"
    path="/clients/create"
    element={
      <ProtectedRoute requiredRole="sales_manager">
        <DashboardLayout>
          <SuspenseRoute><Pages.CreateClient /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/clients/edit/:id"
    path="/clients/edit/:id"
    element={
      <ProtectedRoute requiredRole="sales_manager">
        <DashboardLayout>
          <SuspenseRoute><Pages.CreateClient /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/crm"
    path="/crm"
    element={
      <ProtectedRoute requiredRole={["hr", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.CRM /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/crm/leads/:leadId"
    path="/crm/leads/:leadId"
    element={
      <ProtectedRoute requiredRole="hr">
        <DashboardLayout>
          <SuspenseRoute><Pages.LeadDetail /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/crm/activities/:activityId"
    path="/crm/activities/:activityId"
    element={
      <ProtectedRoute requiredRole={["hr", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.ActivityDetail /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
];

/**
 * Reports & Analytics Routes
 */
export const ReportRoutes = () => [
  <Route
    key="/reports"
    path="/reports"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.Reports /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/analytics"
    path="/analytics"
    element={
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout>
          <SuspenseRoute><Pages.Analytics /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/centralized-reports"
    path="/centralized-reports"
    element={
      <ProtectedRoute requiredRole={["admin", "finance_manager", "cfo", "ceo"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.CentralizedReports /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/reports/dashboard"
    path="/reports/dashboard"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.ReportingDashboard /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/reports/custom"
    path="/reports/custom"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.CustomReports /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/reports/scheduled"
    path="/reports/scheduled"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.ScheduledReports /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/reports/exports"
    path="/reports/exports"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.ReportExports /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/reports/analytics"
    path="/reports/analytics"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.AnalyticsDashboard /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
];

/**
 * Inventory Routes
 */
export const InventoryRoutes = () => [
  <Route
    key="/inventory"
    path="/inventory"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.InventoryManagement /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/inventory/products"
    path="/inventory/products"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.InventoryProducts /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/inventory/bom"
    path="/inventory/bom"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.InventoryBOM /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/inventory/serial-batch"
    path="/inventory/serial-batch"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.InventorySerialBatch /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/inventory/reports"
    path="/inventory/reports"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.InventoryReports /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/inventory/settings"
    path="/inventory/settings"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.InventorySettings /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/inventory/warehouses"
    path="/inventory/warehouses"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.InventoryWarehouses /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/inventory/stock-levels"
    path="/inventory/stock-levels"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.InventoryStockLevels /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/inventory/transfers"
    path="/inventory/transfers"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.InventoryTransfers /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/inventory/adjustments"
    path="/inventory/adjustments"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.InventoryAdjustments /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
];

/**
 * Procurement Routes
 */
export const ProcurementRoutes = () => [
  <Route
    key="/procurement"
    path="/procurement"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.ProcurementManagement /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/procurement/vendors"
    path="/procurement/vendors"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.ProcurementVendors /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/procurement/purchase-orders"
    path="/procurement/purchase-orders"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.ProcurementPurchaseOrders /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/procurement/requisitions"
    path="/procurement/requisitions"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.ProcurementRequisitions /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/procurement/goods-receipts"
    path="/procurement/goods-receipts"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.ProcurementGoodsReceipts /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/procurement/rfq"
    path="/procurement/rfq"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.ProcurementRFQ /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/procurement/vendor-contracts"
    path="/procurement/vendor-contracts"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.ProcurementVendorContracts /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/procurement/vendor-performance"
    path="/procurement/vendor-performance"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.ProcurementVendorPerformance /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/procurement/reports"
    path="/procurement/reports"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.ProcurementReports /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/procurement/settings"
    path="/procurement/settings"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.ProcurementSettings /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
];

/**
 * Assets Routes
 */
export const AssetRoutes = () => [
  <Route
    key="/assets"
    path="/assets"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.Assets /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/assets/categories"
    path="/assets/categories"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.AssetCategories /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/assets/locations"
    path="/assets/locations"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.AssetLocations /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/assets/maintenance"
    path="/assets/maintenance"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.AssetMaintenance /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/assets/depreciation"
    path="/assets/depreciation"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.AssetDepreciation /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/assets/disposals"
    path="/assets/disposals"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.AssetDisposals /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/assets/reports"
    path="/assets/reports"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.AssetReports /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/assets/settings"
    path="/assets/settings"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.AssetSettings /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
];

/**
 * Workflows Routes
 */
export const WorkflowRoutes = () => [
  <Route
    key="/workflows"
    path="/workflows"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.Workflows /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/workflows/instances"
    path="/workflows/instances"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.WorkflowInstances /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/workflows/approvals"
    path="/workflows/approvals"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.WorkflowApprovals /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/workflows/automation"
    path="/workflows/automation"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.WorkflowAutomation /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/workflows/settings"
    path="/workflows/settings"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.WorkflowSettings /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/workflows/builder"
    path="/workflows/builder"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.WorkflowBuilder /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
];

/**
 * Integrations Routes
 */
export const IntegrationRoutes = () => [
  <Route
    key="/integrations"
    path="/integrations"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.Integrations /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/integrations/settings"
    path="/integrations/settings"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.IntegrationSettings /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
];

/**
 * Quotations & Job Costing Routes
 */
export const QuotationRoutes = () => [
  <Route
    key="/quotations"
    path="/quotations"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.Quotations /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/quotations/new"
    path="/quotations/new"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.QuotationForm /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/quotations/:id"
    path="/quotations/:id"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.QuotationForm /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/jobs"
    path="/jobs"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.JobCosting /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
];

/**
 * Other Feature Routes
 */
export const OtherFeatureRoutes = () => [
  <Route
    key="/settings"
    path="/settings"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.Settings /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/page-requests"
    path="/page-requests"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.PageRequestCenter /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/department-management"
    path="/department-management"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.DepartmentManagement /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/ai-features"
    path="/ai-features"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.AIFeatures /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/calendar"
    path="/calendar"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.Calendar /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/notifications"
    path="/notifications"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.Notifications /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/role-requests"
    path="/role-requests"
    element={
      <ProtectedRoute requiredRole="hr">
        <DashboardLayout>
          <SuspenseRoute><Pages.RoleChangeRequests /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/permissions"
    path="/permissions"
    element={
      <ProtectedRoute requiredRole={['super_admin', 'ceo', 'admin']}>
        <DashboardLayout>
          <SuspenseRoute><Pages.AdvancedPermissions /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/advanced-dashboard"
    path="/advanced-dashboard"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.AdvancedDashboard /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/documents"
    path="/documents"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.DocumentManager /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/messages"
    path="/messages"
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <SuspenseRoute><Pages.MessageCenter /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/email-testing"
    path="/email-testing"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.EmailTesting /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route
    key="/view-as-user"
    path="/view-as-user"
    element={
      <ProtectedRoute requiredRole={["admin", "super_admin"]}>
        <DashboardLayout>
          <SuspenseRoute><Pages.ViewAsUser /></SuspenseRoute>
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
];

