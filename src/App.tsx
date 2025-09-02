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
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";
import SignupSuccess from "./pages/SignupSuccess";
import AgencyDashboard from "./pages/AgencyDashboard";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import Users from "./pages/Users";
import Projects from "./pages/Projects";
import Settings from "./pages/Settings";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import LeaveRequests from "./pages/LeaveRequests";
import Payroll from "./pages/Payroll";
import Invoices from "./pages/Invoices";
import Payments from "./pages/Payments";
import Receipts from "./pages/Receipts";
import MyProfile from "./pages/MyProfile";
import MyAttendance from "./pages/MyAttendance";
import MyLeave from "./pages/MyLeave";
import Ledger from "./pages/Ledger";
import Clients from "./pages/Clients";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import ProjectManagement from "./pages/ProjectManagement";
import AIFeatures from "./pages/AIFeatures";
import CreateEmployee from "./pages/CreateEmployee";
import AssignUserRoles from "./pages/AssignUserRoles";
import JobCosting from "./pages/JobCosting";
import Quotations from "./pages/Quotations";
import CRM from "./pages/CRM";
import Accounting from "./pages/Accounting";
import FinancialManagement from "./pages/FinancialManagement";
import EmployeeProjects from "./pages/EmployeeProjects";
import { Reimbursements } from "./pages/Reimbursements";
import SystemDashboard from "./pages/SystemDashboard";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <AuthRedirect />
            <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signup-success" element={<SignupSuccess />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Index />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <DashboardLayout>
                    <Users />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/projects" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <DashboardLayout>
                    <Projects />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Settings />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employees" 
              element={
                <ProtectedRoute requiredRole="hr">
                  <DashboardLayout>
                    <Employees />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/attendance" 
              element={
                <ProtectedRoute requiredRole="hr">
                  <DashboardLayout>
                    <Attendance />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/leave-requests" 
              element={
                <ProtectedRoute requiredRole="hr">
                  <DashboardLayout>
                    <LeaveRequests />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payroll" 
              element={
                <ProtectedRoute requiredRole="finance_manager">
                  <DashboardLayout>
                    <Payroll />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/invoices" 
              element={
                <ProtectedRoute requiredRole="finance_manager">
                  <DashboardLayout>
                    <Invoices />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payments" 
              element={
                <ProtectedRoute requiredRole="finance_manager">
                  <DashboardLayout>
                    <Payments />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/receipts" 
              element={
                <ProtectedRoute requiredRole="finance_manager">
                  <DashboardLayout>
                    <Receipts />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-profile" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <MyProfile />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-attendance" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <MyAttendance />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-leave" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <MyLeave />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ledger" 
              element={
                <ProtectedRoute requiredRole="finance_manager">
                  <DashboardLayout>
                    <Ledger />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/clients" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Clients />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Reports />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Analytics />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/project-management" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ProjectManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ai-features" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AIFeatures />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create-employee" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <DashboardLayout>
                    <CreateEmployee />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/assign-user-roles" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <DashboardLayout>
                    <AssignUserRoles />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/jobs" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <JobCosting />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/quotations" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Quotations />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/crm" 
              element={
                <ProtectedRoute requiredRole="hr">
                  <DashboardLayout>
                    <CRM />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/accounting" 
              element={
                <ProtectedRoute requiredRole="finance_manager">
                  <DashboardLayout>
                    <Accounting />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/financial-management" 
              element={
                <ProtectedRoute requiredRole="finance_manager">
                  <DashboardLayout>
                    <FinancialManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-projects" 
              element={
                <ProtectedRoute requiredRole="employee">
                  <DashboardLayout>
                    <EmployeeProjects />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reimbursements" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Reimbursements />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/agency" 
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <AgencyDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/system" 
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <DashboardLayout>
                    <SystemDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            {/* Redirect old agency signup route to new unified signup */}
            <Route path="/agency-signup" element={<Navigate to="/signup" replace />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
