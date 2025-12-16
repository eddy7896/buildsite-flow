import { NavLink, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { 
  Building, 
  Users, 
  Calculator, 
  DollarSign, 
  User, 
  FileText, 
  Calendar,
  Settings,
  BarChart3,
  ClipboardList,
  Clock,
  UserCheck,
  CreditCard,
  Receipt,
  BookOpen,
  Building2,
  ChartLine,
  Briefcase,
  Users2,
  FileCheck,
  Brain,
  Monitor,
  FolderKanban,
  CalendarDays,
  UserCog,
  Settings2,
  UserPlus
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { getPagesForRole, type PageConfig } from '@/utils/rolePages';
import { AppRole } from '@/utils/roleUtils';

// Icon mapping from string names to icon components
const iconMap: Record<string, any> = {
  Monitor,
  BarChart3,
  Users,
  Users2,
  User,
  Building,
  Building2,
  Calculator,
  DollarSign,
  Calendar,
  Clock,
  TrendingUp: ChartLine,
  AlertCircle: Clock,
  CalendarDays,
  Shield: Monitor,
  ChevronRight: Clock,
  Bell: Clock,
  Briefcase,
  FileText,
  Settings,
  BookOpen,
  ChartLine,
  CreditCard,
  Receipt,
  ClipboardList,
  FolderKanban,
  UserCog,
  Settings2,
  UserPlus,
  FileCheck
};


export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const { userRole, loading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const isMobile = useIsMobile();

  console.log('AppSidebar - userRole:', userRole, 'loading:', loading);

  // Auto-collapse sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile && setOpenMobile) {
      setOpenMobile(false);
    }
  }, [currentPath, isMobile, setOpenMobile]);

  // Don't show any navigation items if still loading or no role
  if (loading || !userRole) {
    return (
      <Sidebar className="w-14" collapsible="icon">
        <SidebarContent className="flex flex-col">
          <div className="p-3 border-b border-sidebar-border">
            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building className="h-4 w-4 text-primary" />
            </div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }
  
  // Get pages for the current role from rolePages mapping
  const role = userRole as AppRole;
  const rolePages = getPagesForRole(role);
  
  // Filter to only show pages that exist and are not settings (settings goes at bottom)
  // Sort by category for better organization
  const mainPages = rolePages
    .filter(page => page.exists && page.category !== 'settings')
    .sort((a, b) => {
      // Define category order
      const categoryOrder: Record<string, number> = {
        'dashboard': 1,
        'system': 2,
        'management': 3,
        'hr': 4,
        'finance': 5,
        'projects': 6,
        'reports': 7,
        'personal': 8
      };
      const orderA = categoryOrder[a.category] || 99;
      const orderB = categoryOrder[b.category] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.title.localeCompare(b.title);
    });
  
  const settingsPage = rolePages.find(page => page.path === '/settings' && page.exists);
  
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return currentPath === '/dashboard';
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar
      className={isMobile ? "w-full" : collapsed ? "w-14" : "w-60"}
      collapsible={isMobile ? "offcanvas" : "icon"}
      variant={isMobile ? "floating" : "sidebar"}
      side={isMobile ? "left" : "left"}
    >
      <SidebarContent className="flex flex-col">
        {/* Logo placeholder when collapsed */}
        {collapsed && !isMobile && (
          <div className="p-3 border-b border-sidebar-border">
            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building className="h-4 w-4 text-primary" />
            </div>
          </div>
        )}
        
        <SidebarGroup className="flex-1 mt-6">
          <SidebarGroupLabel>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building className="h-4 w-4 text-primary" />
                </div>
                {(!collapsed || isMobile) && <span className="text-xl font-bold">BuildFlow</span>}
              </div>
            </div>
          </SidebarGroupLabel>
          
          <SidebarGroupContent className="mt-8">
            <SidebarMenu>
              {mainPages.map((page) => {
                const IconComponent = iconMap[page.icon] || User;
                return (
                  <SidebarMenuItem key={page.path}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={page.path} 
                        end={page.path === '/'}
                        className={({ isActive }) => getNavCls({ isActive })}
                      >
                        <IconComponent className="h-4 w-4" />
                        {(!collapsed || isMobile) && <span>{page.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Settings at bottom */}
        {settingsPage && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={settingsPage.path} 
                      className={({ isActive }) => getNavCls({ isActive })}
                    >
                      <Settings className="h-4 w-4" />
                      {(!collapsed || isMobile) && <span>{settingsPage.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}