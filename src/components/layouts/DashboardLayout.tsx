/**
 * Dashboard Layout Component
 * Provides the standard layout with sidebar and header for authenticated pages
 */

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AgencyHeader } from "@/components/AgencyHeader";
import { ViewAsUserBanner } from "@/components/ViewAsUserBanner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => (
  <SidebarProvider defaultOpen={false}>
    <AppSidebar />
    <SidebarInset className="flex flex-col min-w-0 overflow-hidden">
      <header className="sticky top-0 z-0 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="h-auto py-2.5 sm:py-3 md:py-3.5 px-3 sm:px-4 md:px-5 lg:px-6 flex items-start sm:items-center gap-2 sm:gap-3 overflow-hidden">
          <SidebarTrigger className="mt-0.5 sm:mt-0 mr-1 sm:mr-2 flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 md:h-9 md:w-9 rounded-lg hover:bg-muted transition-colors flex items-center justify-center" />
          <div className="flex-1 min-w-0">
            <AgencyHeader />
          </div>
        </div>
      </header>
      <div className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6 overflow-auto">
        <ViewAsUserBanner />
        {children}
      </div>
    </SidebarInset>
  </SidebarProvider>
);

