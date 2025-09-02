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
  FileCheck
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

const navigationItems = {
  admin: [
    { title: 'Dashboard', url: '/dashboard', icon: BarChart3 },
    { title: 'Users', url: '/users', icon: Users },
    { title: 'CRM', url: '/crm', icon: Users2 },
    { title: 'Clients', url: '/clients', icon: Building2 },
    { title: 'Jobs', url: '/jobs', icon: Briefcase },
    { title: 'Quotations', url: '/quotations', icon: FileCheck },
    { title: 'Projects', url: '/projects', icon: Building },
    { title: 'Employees', url: '/employees', icon: UserCheck },
    { title: 'Attendance', url: '/attendance', icon: Clock },
    { title: 'Leave Requests', url: '/leave-requests', icon: ClipboardList },
    { title: 'Payroll', url: '/payroll', icon: Calculator },
    { title: 'Invoices', url: '/invoices', icon: FileText },
    { title: 'Payments', url: '/payments', icon: CreditCard },
    { title: 'Receipts', url: '/receipts', icon: Receipt },
    { title: 'Ledger', url: '/ledger', icon: BookOpen },
    { title: 'Accounting', url: '/accounting', icon: Calculator },
    { title: 'Reports', url: '/reports', icon: ChartLine },
  ],
  hr: [
    { title: 'Dashboard', url: '/dashboard', icon: BarChart3 },
    { title: 'CRM', url: '/crm', icon: Users2 },
    { title: 'Jobs', url: '/jobs', icon: Briefcase },
    { title: 'Quotations', url: '/quotations', icon: FileCheck },
    { title: 'Employees', url: '/employees', icon: UserCheck },
    { title: 'Attendance', url: '/attendance', icon: Clock },
    { title: 'Leave Requests', url: '/leave-requests', icon: ClipboardList },
    { title: 'Reports', url: '/reports', icon: ChartLine },
    { title: 'My Profile', url: '/my-profile', icon: User },
    { title: 'My Attendance', url: '/my-attendance', icon: Clock },
    { title: 'My Leave', url: '/my-leave', icon: Calendar },
  ],
  finance_manager: [
    { title: 'Dashboard', url: '/dashboard', icon: BarChart3 },
    { title: 'Jobs', url: '/jobs', icon: Briefcase },
    { title: 'Quotations', url: '/quotations', icon: FileCheck },
    { title: 'Payroll', url: '/payroll', icon: Calculator },
    { title: 'Invoices', url: '/invoices', icon: FileText },
    { title: 'Payments', url: '/payments', icon: CreditCard },
    { title: 'Receipts', url: '/receipts', icon: Receipt },
    { title: 'Ledger', url: '/ledger', icon: BookOpen },
    { title: 'Accounting', url: '/accounting', icon: Calculator },
    { title: 'Reports', url: '/reports', icon: ChartLine },
    { title: 'My Profile', url: '/my-profile', icon: User },
    { title: 'My Attendance', url: '/my-attendance', icon: Clock },
    { title: 'My Leave', url: '/my-leave', icon: Calendar },
  ],
  employee: [
    { title: 'Dashboard', url: '/dashboard', icon: BarChart3 },
    { title: 'My Profile', url: '/my-profile', icon: User },
    { title: 'My Attendance', url: '/my-attendance', icon: Clock },
    { title: 'My Leave', url: '/my-leave', icon: Calendar },
  ],
};

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const { userRole, loading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const isMobile = useIsMobile();

  console.log('AppSidebar - userRole:', userRole, 'loading:', loading);
  
  // Don't show any navigation items if still loading or no role
  if (loading || !userRole) {
    return null;
  }
  
  const items = navigationItems[userRole as keyof typeof navigationItems] || navigationItems.employee;
  const collapsed = state === 'collapsed';

  // Auto-collapse sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile && setOpenMobile) {
      setOpenMobile(false);
    }
  }, [currentPath, isMobile, setOpenMobile]);

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
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building className="h-4 w-4 text-primary" />
              </div>
              {(!collapsed || isMobile) && <span className="text-xl font-bold">BuildFlow</span>}
            </div>
          </SidebarGroupLabel>
          
          <SidebarGroupContent className="mt-8">
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/'}
                      className={({ isActive }) => getNavCls({ isActive })}
                    >
                      <item.icon className="h-4 w-4" />
                      {(!collapsed || isMobile) && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Settings at bottom */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/settings" 
                    className={({ isActive }) => getNavCls({ isActive })}
                    >
                      <Settings className="h-4 w-4" />
                      {(!collapsed || isMobile) && <span>Settings</span>}
                    </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}