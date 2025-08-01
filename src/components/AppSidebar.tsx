import { NavLink, useLocation } from 'react-router-dom';
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
  ClipboardList
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

const navigationItems = {
  admin: [
    { title: 'Dashboard', url: '/', icon: BarChart3 },
    { title: 'Projects', url: '/projects', icon: Building },
    { title: 'Users', url: '/users', icon: Users },
    { title: 'HR Management', url: '/hr', icon: Users },
    { title: 'Finance', url: '/finance', icon: DollarSign },
    { title: 'Reports', url: '/reports', icon: FileText },
    { title: 'Settings', url: '/settings', icon: Settings },
  ],
  hr: [
    { title: 'Dashboard', url: '/', icon: BarChart3 },
    { title: 'Employees', url: '/employees', icon: Users },
    { title: 'Attendance', url: '/attendance', icon: Calendar },
    { title: 'Payroll', url: '/payroll', icon: Calculator },
    { title: 'Leave Requests', url: '/leave-requests', icon: ClipboardList },
    { title: 'Reports', url: '/hr-reports', icon: FileText },
  ],
  finance_manager: [
    { title: 'Dashboard', url: '/', icon: BarChart3 },
    { title: 'Invoices', url: '/invoices', icon: FileText },
    { title: 'Payments', url: '/payments', icon: DollarSign },
    { title: 'Receipts', url: '/receipts', icon: FileText },
    { title: 'Ledger', url: '/ledger', icon: Calculator },
    { title: 'Financial Reports', url: '/financial-reports', icon: BarChart3 },
  ],
  employee: [
    { title: 'Dashboard', url: '/', icon: BarChart3 },
    { title: 'My Projects', url: '/my-projects', icon: Building },
    { title: 'Attendance', url: '/my-attendance', icon: Calendar },
    { title: 'Leave Requests', url: '/my-leave', icon: ClipboardList },
    { title: 'Payroll', url: '/my-payroll', icon: Calculator },
    { title: 'Profile', url: '/profile', icon: User },
  ],
};

export function AppSidebar() {
  const { state } = useSidebar();
  const { userRole } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const items = navigationItems[userRole as keyof typeof navigationItems] || navigationItems.employee;
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              {!collapsed && <span>Construction ERP</span>}
            </div>
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
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
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}