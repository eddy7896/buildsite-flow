/**
 * Main App Component
 * Provides app-wide providers and routing configuration
 */

import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ViewAsUserProvider } from "@/contexts/ViewAsUserContext";
import { AuthRedirect } from "@/components/AuthRedirect";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TicketFloatingButton } from "@/components/TicketFloatingButton";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useAuth } from "@/hooks/useAuth";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { AgencyMaintenanceMode } from "@/components/AgencyMaintenanceMode";
import HoverReceiver from "@/visual-edits/VisualEditsMessenger";
import { ThemeSync } from "@/components/ThemeSync";
import { AppRoutes } from "@/routes";

// Initialize console logger on app load
import "@/utils/consoleLogger";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading: authLoading, isSystemSuperAdmin, userRole } = useAuth();
  // Load and apply system settings (SEO, analytics, branding, etc.) - only for super admins
  // For agency admins, this will fail silently as they don't have access to system settings
  useSystemSettings();
  
  // Check maintenance mode (super admins bypass)
  const { maintenanceMode, maintenanceMessage, loading: maintenanceLoading } = useMaintenanceMode();
  
  // Show agency maintenance mode if enabled and user is not super admin
  if (!maintenanceLoading && maintenanceMode && !isSystemSuperAdmin && userRole !== 'super_admin') {
    return <AgencyMaintenanceMode message={maintenanceMessage || undefined} />;
  }
  
  return (
    <>
      <ThemeSync />
      <BrowserRouter>
        <ScrollToTop />
        <AuthRedirect />
        {!authLoading && user && <TicketFloatingButton />}
        <AppRoutes />
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem
      disableTransitionOnChange={false}
      // enableSystem allows the theme to respect user's OS preference
      // If OS is light mode -> website shows light mode
      // If OS is dark mode -> website shows dark mode
      // User can override by clicking theme toggle
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HoverReceiver />
        <ErrorBoundary>
          <AuthProvider>
            <ViewAsUserProvider>
              <AppContent />
            </ViewAsUserProvider>
          </AuthProvider>
        </ErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
