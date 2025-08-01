import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/AppSidebar";
import { AgencyHeader } from "@/components/AgencyHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
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
import CreateEmployee from "./pages/CreateEmployee";
import AssignUserRoles from "./pages/AssignUserRoles";

const queryClient = new QueryClient();

const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <main className="flex-1">
        <header className="h-14 flex items-center border-b bg-card px-4">
          <SidebarTrigger />
          <AgencyHeader />
        </header>
        {children}
      </main>
    </div>
  </SidebarProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/" 
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
                <ProtectedRoute requiredRole="admin">
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
