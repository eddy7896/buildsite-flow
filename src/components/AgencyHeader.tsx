import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  User,
  Settings,
  LogOut,
  HelpCircle,
  Clock,
  Wifi,
  WifiOff,
  Calendar,
  FileText,
  Users,
  Briefcase,
  DollarSign,
  BarChart3,
  Shield,
  Home,
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { useAgencySettings } from '@/hooks/useAgencySettings';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Route mapping for breadcrumbs
const routeMap: Record<string, { label: string; path: string }[]> = {
  '/dashboard': [{ label: 'Dashboard', path: '/dashboard' }],
  '/super-admin': [{ label: 'Super Admin', path: '/super-admin' }],
  '/employees': [{ label: 'Employees', path: '/employees' }],
  '/projects': [{ label: 'Projects', path: '/projects' }],
  '/attendance': [{ label: 'Attendance', path: '/attendance' }],
  '/payroll': [{ label: 'Payroll', path: '/payroll' }],
  '/settings': [{ label: 'Settings', path: '/settings' }],
  '/clients': [{ label: 'Clients', path: '/clients' }],
  '/crm': [{ label: 'CRM', path: '/crm' }],
  '/financial-management': [{ label: 'Financial Management', path: '/financial-management' }],
  '/reports': [{ label: 'Reports', path: '/reports' }],
  '/analytics': [{ label: 'Analytics', path: '/analytics' }],
  '/department-management': [{ label: 'Department Management', path: '/department-management' }],
  '/my-profile': [{ label: 'My Profile', path: '/my-profile' }],
  '/notifications': [{ label: 'Notifications', path: '/notifications' }],
  '/system-dashboard': [{ label: 'System Dashboard', path: '/system-dashboard' }],
};

// Search items for command palette
const searchItems = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: Home, shortcut: '⌘D' },
  { id: 'employees', label: 'Employees', path: '/employees', icon: Users, shortcut: '⌘E' },
  { id: 'projects', label: 'Projects', path: '/projects', icon: Briefcase, shortcut: '⌘P' },
  { id: 'attendance', label: 'Attendance', path: '/attendance', icon: Calendar, shortcut: '⌘A' },
  { id: 'payroll', label: 'Payroll', path: '/payroll', icon: DollarSign, shortcut: '⌘Y' },
  { id: 'clients', label: 'Clients', path: '/clients', icon: Users, shortcut: '⌘C' },
  { id: 'crm', label: 'CRM', path: '/crm', icon: Briefcase, shortcut: '⌘R' },
  { id: 'financial', label: 'Financial Management', path: '/financial-management', icon: DollarSign, shortcut: '⌘F' },
  { id: 'reports', label: 'Reports', path: '/reports', icon: FileText, shortcut: '⌘T' },
  { id: 'analytics', label: 'Analytics', path: '/analytics', icon: BarChart3, shortcut: '⌘N' },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings, shortcut: '⌘S' },
  { id: 'profile', label: 'My Profile', path: '/my-profile', icon: User, shortcut: '⌘M' },
];

export const AgencyHeader = () => {
  const { settings: agencySettings, loading: agencyLoading } = useAgencySettings();
  const { user, profile, userRole, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Debug: Log image URLs when they change (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (agencySettings?.logo_url) {
        console.log('[AgencyHeader] Logo URL:', agencySettings.logo_url.substring(0, 100), 'Type:', typeof agencySettings.logo_url);
      }
      if (profile?.avatar_url) {
        console.log('[AgencyHeader] Avatar URL:', profile.avatar_url.substring(0, 100), 'Type:', typeof profile.avatar_url);
      }
    }
  }, [agencySettings?.logo_url, profile?.avatar_url]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [searchOpen, setSearchOpen] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getBreadcrumbs = () => {
    const path = location.pathname;
    const crumbs: { label: string; path: string }[] = [];

    // Check if we have a mapped route
    if (routeMap[path]) {
      // If we're on dashboard, don't add duplicate Home entry
      if (path === '/dashboard') {
        return routeMap[path];
      }
      // For other routes, add Home as first crumb
      return [{ label: 'Home', path: '/dashboard' }, ...routeMap[path]];
    }

    // Otherwise, parse the path
    // Add Home as first crumb only if not already on dashboard
    if (path !== '/dashboard') {
      crumbs.push({ label: 'Home', path: '/dashboard' });
    }
    
    const segments = path.split('/').filter(Boolean);
    let currentPath = '';
    segments.forEach((segment) => {
      currentPath += `/${segment}`;
      // Skip if this would create a duplicate dashboard entry
      if (currentPath !== '/dashboard' || crumbs.length === 0) {
        const label = segment
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        crumbs.push({ label, path: currentPath });
      }
    });

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const userDisplayName = profile?.full_name || user?.email || 'User';
  const userInitials = userDisplayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'admin':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'hr':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'finance_manager':
      case 'cfo':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getRoleLabel = (role: string | null) => {
    if (!role) return 'User';
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get current page title for display
  const currentPageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard';
  
  // Get page icon based on route
  const getPageIcon = (path: string) => {
    const iconMap: Record<string, any> = {
      '/dashboard': Home,
      '/employees': Users,
      '/projects': Briefcase,
      '/attendance': Calendar,
      '/payroll': DollarSign,
      '/clients': Users,
      '/crm': Briefcase,
      '/financial-management': DollarSign,
      '/reports': FileText,
      '/analytics': BarChart3,
      '/settings': Settings,
      '/my-profile': User,
      '/system-dashboard': Shield,
    };
    return iconMap[path] || FileText;
  };

  const CurrentPageIcon = getPageIcon(location.pathname);

  return (
    <TooltipProvider>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2 sm:gap-3 md:gap-4 min-w-0">
        {/* Left Section: Enhanced Breadcrumbs with Page Context */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0 overflow-hidden">
          {/* Current Page Icon & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <CurrentPageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-foreground truncate leading-tight">
                {currentPageTitle}
              </h1>
              <Breadcrumb className="hidden sm:block">
                <BreadcrumbList className="flex-wrap max-w-full text-[10px] sm:text-xs">
                  {breadcrumbs.slice(0, -1).map((crumb, index) => (
                    <React.Fragment key={`${crumb.path}-${index}`}>
                      <BreadcrumbItem className="max-w-[100px] sm:max-w-[150px] truncate">
                        <BreadcrumbLink asChild>
                          <Link
                            to={crumb.path}
                            className="text-muted-foreground hover:text-foreground truncate transition-colors"
                          >
                            {crumb.label}
                          </Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      {index < breadcrumbs.slice(0, -1).length - 1 && (
                        <BreadcrumbSeparator className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      )}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          {/* Full Breadcrumb Trail (on larger screens) */}
          <div className="hidden xl:flex items-center gap-2 flex-1 min-w-0 ml-2">
            <Breadcrumb>
              <BreadcrumbList className="flex-wrap max-w-full">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={`${crumb.path}-${index}`}>
                    <BreadcrumbItem className="max-w-[140px] lg:max-w-[180px] truncate">
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage className="text-xs sm:text-sm font-semibold text-foreground truncate">
                          {crumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link
                            to={crumb.path}
                            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground truncate transition-colors font-medium"
                          >
                            {crumb.label}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && (
                      <BreadcrumbSeparator className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground/50" />
                    )}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Center Section: Agency Info (on larger screens) */}
        {agencySettings?.agency_name && (
          <div className="hidden xl:flex items-center gap-2 px-2 xl:px-4 flex-shrink-0">
            {agencySettings?.logo_url && 
             typeof agencySettings.logo_url === 'string' && 
             agencySettings.logo_url.trim() !== '' && (
              <img
                src={agencySettings.logo_url}
                alt="Agency Logo"
                className="h-5 w-5 xl:h-6 xl:w-6 object-contain"
                style={{ display: 'block' }}
                onError={(e) => {
                  // Log error for debugging but don't hide - let it fail gracefully
                  console.warn('Failed to load agency logo:', agencySettings.logo_url?.substring(0, 50));
                  const img = e.target as HTMLImageElement;
                  img.style.opacity = '0';
                }}
                onLoad={(e) => {
                  // Ensure image is visible when it loads successfully
                  const img = e.target as HTMLImageElement;
                  img.style.opacity = '1';
                  img.style.display = 'block';
                }}
              />
            )}
            <span className="text-xs xl:text-sm font-semibold text-foreground whitespace-nowrap">
              {agencySettings.agency_name}
            </span>
          </div>
        )}

        {/* Right Section: Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 sm:mt-0 mt-1">
          {/* Global Search */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Search (⌘K)</p>
            </TooltipContent>
          </Tooltip>

          {/* Real-time Clock */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden lg:flex items-center gap-1.5 xl:gap-2 px-1.5 xl:px-2 py-1 rounded-md bg-muted/50 text-[10px] xl:text-xs">
                <Clock className="h-3 w-3 xl:h-3.5 xl:w-3.5 text-muted-foreground flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-mono font-medium leading-none">
                    {formatTime(currentTime)}
                  </span>
                  <span className="text-[9px] xl:text-[10px] text-muted-foreground leading-none mt-0.5">
                    {formatDate(currentTime)}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Current Date & Time</p>
            </TooltipContent>
          </Tooltip>

          {/* System Status */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden md:flex items-center gap-1 xl:gap-1.5 px-1.5 xl:px-2 py-1 rounded-md bg-muted/50">
                {isOnline ? (
                  <Wifi className="h-3 w-3 xl:h-3.5 xl:w-3.5 text-green-600 flex-shrink-0" />
                ) : (
                  <WifiOff className="h-3 w-3 xl:h-3.5 xl:w-3.5 text-red-600 flex-shrink-0" />
                )}
                <span className="text-[10px] xl:text-xs font-medium whitespace-nowrap">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isOnline ? 'System is online' : 'System is offline'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Notifications */}
          <NotificationCenter />

          {/* Help/Support */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => {
                  // Open help documentation or support
                  window.open('https://docs.buildflow.com', '_blank');
                }}
              >
                <HelpCircle className="h-4 w-4" />
                <span className="sr-only">Help & Support</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Help & Support</p>
            </TooltipContent>
          </Tooltip>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full p-0 flex-shrink-0">
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                  <AvatarImage
                    src={
                      profile?.avatar_url && 
                      typeof profile.avatar_url === 'string' && 
                      profile.avatar_url.trim() !== ''
                        ? profile.avatar_url
                        : undefined
                    }
                    alt={userDisplayName}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] sm:text-xs font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={
                          profile?.avatar_url && 
                          typeof profile.avatar_url === 'string' && 
                          profile.avatar_url.trim() !== ''
                            ? profile.avatar_url
                            : undefined
                        }
                        alt={userDisplayName}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">
                        {userDisplayName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {user?.email}
                      </p>
                      {userRole && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'mt-1.5 w-fit text-[10px] px-1.5 py-0',
                            getRoleBadgeColor(userRole)
                          )}
                        >
                          {getRoleLabel(userRole)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link to="/my-profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                    <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                  </Link>
                </DropdownMenuItem>
                {userRole && (userRole === 'admin' || userRole === 'super_admin') && (
                  <DropdownMenuItem asChild>
                    <Link to="/system-dashboard" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>System Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  window.open('https://docs.buildflow.com', '_blank');
                }}
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Agency Logo/Name (on smaller screens, if not shown in center) */}
          {agencySettings?.agency_name && (
            <div className="xl:hidden flex items-center gap-1.5 sm:gap-2 ml-1 sm:ml-2 flex-shrink-0">
              {agencySettings?.logo_url && 
               typeof agencySettings.logo_url === 'string' && 
               agencySettings.logo_url.trim() !== '' && (
                <img
                  src={agencySettings.logo_url}
                  alt="Agency Logo"
                  className="h-5 w-5 sm:h-6 sm:w-6 object-contain"
                  style={{ display: 'block' }}
                  onError={(e) => {
                    // Log error for debugging but don't hide - let it fail gracefully
                    console.warn('Failed to load agency logo:', agencySettings.logo_url?.substring(0, 50));
                    const img = e.target as HTMLImageElement;
                    img.style.opacity = '0';
                  }}
                  onLoad={(e) => {
                    // Ensure image is visible when it loads successfully
                    const img = e.target as HTMLImageElement;
                    img.style.opacity = '1';
                    img.style.display = 'block';
                  }}
                />
              )}
              <span className="text-[10px] sm:text-xs font-semibold text-foreground whitespace-nowrap max-w-[80px] sm:max-w-[100px] truncate">
                {agencySettings.agency_name}
              </span>
            </div>
          )}
        </div>

        {/* Command Palette (Search Dialog) */}
        <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              {searchItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => {
                      navigate(item.path);
                      setSearchOpen(false);
                    }}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <CommandShortcut>{item.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
    </TooltipProvider>
  );
};
