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
  ClipboardList,
  Clock,
  UserCheck,
  CreditCard,
  Receipt,
  BookOpen,
  Building2
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
    { title: 'Users', url: '/users', icon: Users },
    { title: 'Clients', url: '/clients', icon: Building2 },
    { title: 'Projects', url: '/projects', icon: Building },
    { title: 'Employees', url: '/employees', icon: UserCheck },
    { title: 'Attendance', url: '/attendance', icon: Clock },
    { title: 'Leave Requests', url: '/leave-requests', icon: ClipboardList },
    { title: 'Payroll', url: '/payroll', icon: Calculator },
    { title: 'Invoices', url: '/invoices', icon: FileText },
    { title: 'Payments', url: '/payments', icon: CreditCard },
    { title: 'Receipts', url: '/receipts', icon: Receipt },
    { title: 'Ledger', url: '/ledger', icon: BookOpen },
    { title: 'Settings', url: '/settings', icon: Settings },
  ],
  hr: [
    { title: 'Dashboard', url: '/', icon: BarChart3 },
    { title: 'Employees', url: '/employees', icon: UserCheck },
    { title: 'Attendance', url: '/attendance', icon: Clock },
    { title: 'Leave Requests', url: '/leave-requests', icon: ClipboardList },
    { title: 'My Profile', url: '/my-profile', icon: User },
    { title: 'My Attendance', url: '/my-attendance', icon: Clock },
    { title: 'My Leave', url: '/my-leave', icon: Calendar },
    { title: 'Settings', url: '/settings', icon: Settings },
  ],
  finance_manager: [
    { title: 'Dashboard', url: '/', icon: BarChart3 },
    { title: 'Payroll', url: '/payroll', icon: Calculator },
    { title: 'Invoices', url: '/invoices', icon: FileText },
    { title: 'Payments', url: '/payments', icon: CreditCard },
    { title: 'Receipts', url: '/receipts', icon: Receipt },
    { title: 'Ledger', url: '/ledger', icon: BookOpen },
    { title: 'My Profile', url: '/my-profile', icon: User },
    { title: 'My Attendance', url: '/my-attendance', icon: Clock },
    { title: 'My Leave', url: '/my-leave', icon: Calendar },
    { title: 'Settings', url: '/settings', icon: Settings },
  ],
  employee: [
    { title: 'Dashboard', url: '/', icon: BarChart3 },
    { title: 'My Profile', url: '/my-profile', icon: User },
    { title: 'My Attendance', url: '/my-attendance', icon: Clock },
    { title: 'My Leave', url: '/my-leave', icon: Calendar },
    { title: 'Settings', url: '/settings', icon: Settings },
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