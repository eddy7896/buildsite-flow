/**
 * Super Admin Layout Component
 * Provides layout specifically for system-level super admin dashboard
 * No agency context - only system-level navigation
 */

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { SuperAdminNav } from "./SuperAdminNav";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => {
  const { userRole, isSystemSuperAdmin } = useAuth();

  // Redirect if not system super admin
  if (!isSystemSuperAdmin && userRole !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <SuperAdminNav />
      <SidebarInset className="flex flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-0 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="h-auto py-2.5 sm:py-3 md:py-3.5 px-3 sm:px-4 md:px-5 lg:px-6 flex items-start sm:items-center gap-2 sm:gap-3 overflow-hidden">
            <SidebarTrigger className="mt-0.5 sm:mt-0 mr-1 sm:mr-2 flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 md:h-9 md:w-9 rounded-lg hover:bg-muted transition-colors flex items-center justify-center" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold">BuildFlow System Administration</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">Manage agencies, plans, and system settings</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

