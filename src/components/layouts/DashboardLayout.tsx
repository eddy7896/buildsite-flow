/**
 * Dashboard Layout Component
 * Provides the standard layout with sidebar and header for authenticated pages
 */

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ViewAsUserBanner } from "@/components/ViewAsUserBanner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => (
  <SidebarProvider defaultOpen={false}>
    <AppSidebar />
    <SidebarInset className="flex flex-col min-w-0">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 relative overflow-hidden">
        <div className="h-auto py-3 sm:py-4 px-4 sm:px-6">
          <div className="flex items-center gap-4 w-full">
            <SidebarTrigger className="flex-shrink-0 relative z-40" />
            <div className="flex-1 min-w-0 overflow-hidden">
              <DashboardHeader />
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <ViewAsUserBanner />
        {children}
      </div>
    </SidebarInset>
  </SidebarProvider>
);

