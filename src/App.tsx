import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/AppSidebar";
import { AgencyHeader } from "@/components/AgencyHeader";
import { AuthRedirect } from "@/components/AuthRedirect";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy load all page components for better code splitting
const Index = React.lazy(() => import("./pages/Index"));
const Landing = React.lazy(() => import("./pages/Landing"));
const Pricing = React.lazy(() => import("./pages/Pricing"));
const Auth = React.lazy(() => import("./pages/Auth"));
const SignupSuccess = React.lazy(() => import("./pages/SignupSuccess"));
const AgencyDashboard = React.lazy(() => import("./pages/AgencyDashboard"));
const AgencyOnboardingWizard = React.lazy(() => import("./components/AgencyOnboardingWizard"));
const AgencySetup = React.lazy(() => import("./pages/AgencySetup"));
const SuperAdminDashboard = React.lazy(() => import("./pages/SuperAdminDashboard"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const EmployeeManagement = React.lazy(() => import("./pages/EmployeeManagement"));
const Projects = React.lazy(() => import("./pages/Projects"));
const Settings = React.lazy(() => import("./pages/Settings"));
const Attendance = React.lazy(() => import("./pages/Attendance"));
const LeaveRequests = React.lazy(() => import("./pages/LeaveRequests"));
const Payroll = React.lazy(() => import("./pages/Payroll"));
const Invoices = React.lazy(() => import("./pages/Invoices"));
const Payments = React.lazy(() => import("./pages/Payments"));
const Receipts = React.lazy(() => import("./pages/Receipts"));
const MyProfile = React.lazy(() => import("./pages/MyProfile"));
const MyAttendance = React.lazy(() => import("./pages/MyAttendance"));
const MyLeave = React.lazy(() => import("./pages/MyLeave"));
const Ledger = React.lazy(() => import("./pages/Ledger"));
const CreateJournalEntry = React.lazy(() => import("./pages/CreateJournalEntry"));
const Clients = React.lazy(() => import("./pages/Clients"));
const Reports = React.lazy(() => import("./pages/Reports"));
const Analytics = React.lazy(() => import("./pages/Analytics"));
const ProjectManagement = React.lazy(() => import("./pages/ProjectManagement"));
const DepartmentManagement = React.lazy(() => import("./pages/DepartmentManagement"));
const AIFeatures = React.lazy(() => import("./pages/AIFeatures"));
const CreateEmployee = React.lazy(() => import("./pages/CreateEmployee"));
const AssignUserRoles = React.lazy(() => import("./pages/AssignUserRoles"));
const JobCosting = React.lazy(() => import("./pages/JobCosting"));
const Quotations = React.lazy(() => import("./pages/Quotations"));
const CRM = React.lazy(() => import("./pages/CRM"));
const FinancialManagement = React.lazy(() => import("./pages/FinancialManagement"));
const GstCompliance = React.lazy(() => import("./pages/GstCompliance"));
const EmployeeProjects = React.lazy(() => import("./pages/EmployeeProjects"));
const Reimbursements = React.lazy(() => import("./pages/Reimbursements").then(m => ({ default: m.Reimbursements })));
const SystemDashboard = React.lazy(() => import("./pages/SystemDashboard"));
const Calendar = React.lazy(() => import("./pages/Calendar"));
const HolidayManagement = React.lazy(() => import('./pages/HolidayManagement'));
const CentralizedReports = React.lazy(() => import("./pages/CentralizedReports"));
const Notifications = React.lazy(() => import("./pages/Notifications"));

// Lazy load component modules
const RoleChangeRequests = React.lazy(() => import('./components/RoleChangeRequests').then(m => ({ default: m.RoleChangeRequests })));
const AdvancedPermissions = React.lazy(() => import('./components/AdvancedPermissions').then(m => ({ default: m.AdvancedPermissions })));
const AdvancedDashboard = React.lazy(() => import('./components/analytics/AdvancedDashboard').then(m => ({ default: m.AdvancedDashboard })));
const DocumentManager = React.lazy(() => import('./components/documents/DocumentManager').then(m => ({ default: m.DocumentManager })));
const MessageCenter = React.lazy(() => import('./components/communication/MessageCenter').then(m => ({ default: m.MessageCenter })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Suspense wrapper utility
const SuspenseRoute = ({ children }: { children: React.ReactNode }) => (
  <React.Suspense fallback={<LoadingFallback />}>
    {children}
  </React.Suspense>
);

const queryClient = new QueryClient();

const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider defaultOpen={false}>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center border-b bg-card px-4 lg:px-6 sticky top-0 z-40">
          <SidebarTrigger className="mr-2" />
          <AgencyHeader />
        </header>
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  </SidebarProvider>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <AuthProvider>
            <BrowserRouter>
              <AuthRedirect />
              <Routes>
              <Route path="/" element={<SuspenseRoute><Landing /></SuspenseRoute>} />
              <Route path="/pricing" element={<SuspenseRoute><Pricing /></SuspenseRoute>} />
              <Route path="/auth" element={<SuspenseRoute><Auth /></SuspenseRoute>} />
              <Route path="/agency-signup" element={<SuspenseRoute><AgencyOnboardingWizard /></SuspenseRoute>} />
              <Route path="/signup-success" element={<SuspenseRoute><SignupSuccess /></SuspenseRoute>} />
              <Route path="/forgot-password" element={<SuspenseRoute><ForgotPassword /></SuspenseRoute>} />
              
              <Route 
                path="/agency-setup" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DashboardLayout>
                      <SuspenseRoute><AgencySetup /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SuspenseRoute><Index /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/employee-management" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DashboardLayout>
                      <SuspenseRoute><EmployeeManagement /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Redirect old routes to unified employee management */}
              <Route 
                path="/my-team" 
                element={<Navigate to="/employee-management" replace />} 
              />
              <Route 
                path="/users" 
                element={<Navigate to="/employee-management" replace />} 
              />
              <Route 
                path="/employees" 
                element={<Navigate to="/employee-management" replace />} 
              />
              
              <Route 
                path="/project-management" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SuspenseRoute><ProjectManagement /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/projects" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DashboardLayout>
                      <SuspenseRoute><Projects /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SuspenseRoute><Settings /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/attendance" 
                element={
                  <ProtectedRoute requiredRole="hr">
                    <DashboardLayout>
                      <SuspenseRoute><Attendance /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/leave-requests" 
                element={
                  <ProtectedRoute requiredRole="hr">
                    <DashboardLayout>
                      <SuspenseRoute><LeaveRequests /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/payroll" 
                element={
                  <ProtectedRoute requiredRole={["admin", "finance_manager", "cfo"]}>
                    <DashboardLayout>
                      <SuspenseRoute><Payroll /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/invoices" 
                element={
                  <ProtectedRoute requiredRole={["admin", "finance_manager", "cfo"]}>
                    <DashboardLayout>
                      <SuspenseRoute><Invoices /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/payments" 
                element={
                  <ProtectedRoute requiredRole={["admin", "finance_manager", "cfo"]}>
                    <DashboardLayout>
                      <SuspenseRoute><Payments /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/receipts" 
                element={
                  <ProtectedRoute requiredRole={["admin", "finance_manager", "cfo"]}>
                    <DashboardLayout>
                      <SuspenseRoute><Receipts /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/my-profile" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SuspenseRoute><MyProfile /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/my-attendance" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SuspenseRoute><MyAttendance /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/my-leave" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SuspenseRoute><MyLeave /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/ledger" 
                element={
                  <ProtectedRoute requiredRole={["admin", "finance_manager", "cfo"]}>
                    <DashboardLayout>
                      <SuspenseRoute><Ledger /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/ledger/create-entry" 
                element={
                  <ProtectedRoute requiredRole={["admin", "finance_manager", "cfo"]}>
                    <DashboardLayout>
                      <SuspenseRoute><CreateJournalEntry /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/clients" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SuspenseRoute><Clients /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DashboardLayout>
                      <SuspenseRoute><Reports /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DashboardLayout>
                      <SuspenseRoute><Analytics /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/department-management" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SuspenseRoute><DepartmentManagement /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/ai-features" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SuspenseRoute><AIFeatures /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/create-employee" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DashboardLayout>
                      <SuspenseRoute><CreateEmployee /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/assign-user-roles" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DashboardLayout>
                      <SuspenseRoute><AssignUserRoles /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/jobs" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SuspenseRoute><JobCosting /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/quotations" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SuspenseRoute><Quotations /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/crm" 
                element={
                  <ProtectedRoute requiredRole="hr">
                    <DashboardLayout>
                      <SuspenseRoute><CRM /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/calendar" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SuspenseRoute><Calendar /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/financial-management" 
                element={
                  <ProtectedRoute requiredRole={["admin", "finance_manager", "ceo", "cfo"]}>
                    <DashboardLayout>
                      <SuspenseRoute><FinancialManagement /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/gst-compliance" 
                element={
                  <ProtectedRoute requiredRole={["admin", "finance_manager", "cfo"]}>
                    <DashboardLayout>
                      <SuspenseRoute><GstCompliance /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/my-projects" 
                element={
                  <ProtectedRoute requiredRole="employee">
                    <DashboardLayout>
                      <SuspenseRoute><EmployeeProjects /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/reimbursements" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SuspenseRoute><Reimbursements /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/holiday-management" 
                element={
                  <ProtectedRoute requiredRole="hr">
                    <DashboardLayout>
                      <SuspenseRoute><HolidayManagement /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/centralized-reports" 
                element={
                  <ProtectedRoute requiredRole={["admin", "finance_manager", "cfo", "ceo"]}>
                    <DashboardLayout>
                      <SuspenseRoute><CentralizedReports /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route
                path="/agency" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DashboardLayout>
                      <SuspenseRoute><AgencyDashboard /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route
                path="/agency/:agencyId/super-admin-dashboard"
                element={
                  <ProtectedRoute requiredRole="super_admin">
                    <DashboardLayout>
                      <SuspenseRoute><SuperAdminDashboard /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route 
                path="/system" 
                element={
                  <ProtectedRoute requiredRole="super_admin">
                    <DashboardLayout>
                      <SuspenseRoute><SystemDashboard /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/role-requests" 
                element={
                  <ProtectedRoute requiredRole="hr">
                    <DashboardLayout>
                      <SuspenseRoute><RoleChangeRequests /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/permissions" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SuspenseRoute><AdvancedPermissions /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/advanced-dashboard" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DashboardLayout>
                      <SuspenseRoute><AdvancedDashboard /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/documents" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SuspenseRoute><DocumentManager /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/messages" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SuspenseRoute><MessageCenter /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SuspenseRoute><Notifications /></SuspenseRoute>
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route path="*" element={<SuspenseRoute><NotFound /></SuspenseRoute>} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;