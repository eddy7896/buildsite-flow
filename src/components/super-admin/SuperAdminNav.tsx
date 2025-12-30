/**
 * Super Admin Navigation Component
 * System-level navigation for super admin (no agency context)
 */

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Server,
  Building2,
  Settings,
  CreditCard,
  FileText,
  BarChart3,
  Activity,
  Mail,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "Dashboard",
    icon: Server,
    path: "/super-admin",
  },
  {
    title: "Agencies",
    icon: Building2,
    path: "/super-admin/agencies",
  },
  {
    title: "System Settings",
    icon: Settings,
    path: "/super-admin/system-settings",
  },
  {
    title: "Plans",
    icon: CreditCard,
    path: "/super-admin/plans",
  },
  {
    title: "Page Catalog",
    icon: FileText,
    path: "/super-admin/page-catalog",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    path: "/super-admin/analytics",
  },
  {
    title: "System Health",
    icon: Activity,
    path: "/system-health",
  },
  {
    title: "Email Testing",
    icon: Mail,
    path: "/email-testing",
  },
];

export function SuperAdminNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>System Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path !== "/super-admin" && location.pathname.startsWith(item.path));
                
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      isActive={isActive}
                      className="w-full justify-start"
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.title}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="px-2 py-1.5">
                  <div className="text-xs text-muted-foreground mb-1">
                    Logged in as
                  </div>
                  <div className="text-sm font-medium truncate">
                    {user?.email || "Super Admin"}
                  </div>
                </div>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

