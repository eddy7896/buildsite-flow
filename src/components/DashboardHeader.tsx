import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  User,
  Settings,
  LogOut,
  HelpCircle,
  Moon,
  Sun,
  Bell,
  Plus,
  Briefcase,
  UserPlus,
  FileText,
  Users,
  DollarSign,
  Calendar,
  Clock,
  Wifi,
  WifiOff,
  Keyboard,
  Shield,
  ClipboardList,
  Receipt,
  CalendarDays,
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
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
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useThemeSync } from '@/hooks/useThemeSync';

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
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', shortcut: '⌘D' },
  { id: 'employees', label: 'Employees', path: '/employees', shortcut: '⌘E' },
  { id: 'projects', label: 'Projects', path: '/projects', shortcut: '⌘P' },
  { id: 'attendance', label: 'Attendance', path: '/attendance', shortcut: '⌘A' },
  { id: 'payroll', label: 'Payroll', path: '/payroll', shortcut: '⌘Y' },
  { id: 'clients', label: 'Clients', path: '/clients', shortcut: '⌘C' },
  { id: 'crm', label: 'CRM', path: '/crm', shortcut: '⌘R' },
  { id: 'financial', label: 'Financial Management', path: '/financial-management', shortcut: '⌘F' },
  { id: 'reports', label: 'Reports', path: '/reports', shortcut: '⌘T' },
  { id: 'analytics', label: 'Analytics', path: '/analytics', shortcut: '⌘N' },
  { id: 'settings', label: 'Settings', path: '/settings', shortcut: '⌘S' },
  { id: 'profile', label: 'My Profile', path: '/my-profile', shortcut: '⌘M' },
];

export const DashboardHeader = () => {
  const { user, profile, userRole, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { theme, resolvedTheme, toggleTheme, mounted: themeMounted } = useThemeSync();

  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
      // Keyboard shortcuts help (Cmd/Ctrl + ?)
      if (e.key === '?' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShortcutsOpen((open) => !open);
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

    if (routeMap[path]) {
      if (path === '/dashboard') {
        return routeMap[path];
      }
      return [{ label: 'Home', path: '/dashboard' }, ...routeMap[path]];
    }

    if (path !== '/dashboard') {
      crumbs.push({ label: 'Home', path: '/dashboard' });
    }
    
    const segments = path.split('/').filter(Boolean);
    let currentPath = '';
    segments.forEach((segment) => {
      currentPath += `/${segment}`;
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

  const currentPageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard';

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

  // Determine if dark mode is active
  const isDark = themeMounted && (
    resolvedTheme === 'dark' || 
    (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  // Get quick create actions based on role
  const getQuickCreateActions = () => {
    const actions: Array<{ label: string; icon: any; path: string; shortcut?: string }> = [];

    // Admin/HR actions
    if (userRole === 'admin' || userRole === 'hr' || userRole === 'super_admin') {
      actions.push(
        { label: 'Add Employee', icon: UserPlus, path: '/create-employee', shortcut: '⌘E' },
        { label: 'Create Project', icon: Briefcase, path: '/project-management', shortcut: '⌘P' },
        { label: 'Add Client', icon: Users, path: '/clients', shortcut: '⌘C' }
      );
    }

    // Finance actions
    if (userRole === 'admin' || userRole === 'finance_manager' || userRole === 'cfo' || userRole === 'super_admin') {
      actions.push(
        { label: 'Create Invoice', icon: FileText, path: '/invoices', shortcut: '⌘I' },
        { label: 'Create Receipt', icon: Receipt, path: '/receipts', shortcut: '⌘R' }
      );
    }

    // HR/Admin calendar actions
    if (userRole === 'admin' || userRole === 'hr' || userRole === 'super_admin') {
      actions.push(
        { label: 'Create Event', icon: Calendar, path: '/calendar', shortcut: '⌘E' },
        { label: 'Add Holiday', icon: CalendarDays, path: '/holiday-management', shortcut: '⌘H' }
      );
    }

    // Employee actions
    if (userRole === 'employee' || !userRole) {
      actions.push(
        { label: 'Submit Leave', icon: Calendar, path: '/my-leave', shortcut: '⌘L' },
        { label: 'Log Time', icon: Clock, path: '/my-attendance', shortcut: '⌘T' }
      );
    }

    // Project Manager actions
    if (userRole === 'project_manager' || userRole === 'admin') {
      actions.push(
        { label: 'Create Task', icon: ClipboardList, path: '/project-management', shortcut: '⌘T' }
      );
    }

    return actions;
  };

  const quickCreateActions = getQuickCreateActions();

  // Keyboard shortcuts list
  const keyboardShortcuts = [
    { keys: '⌘K', description: 'Open search' },
    { keys: '⌘?', description: 'Show keyboard shortcuts' },
    { keys: '⌘B', description: 'Toggle sidebar' },
    { keys: '⌘D', description: 'Go to dashboard' },
    { keys: '⌘E', description: 'Go to employees' },
    { keys: '⌘P', description: 'Go to projects' },
    { keys: '⌘S', description: 'Go to settings' },
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between w-full gap-3">
        {/* Left: Page Title & Breadcrumbs */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex flex-col min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">
              {currentPageTitle}
            </h1>
            {breadcrumbs.length > 1 && (
              <Breadcrumb className="hidden sm:block">
                <BreadcrumbList className="text-xs">
                  {breadcrumbs.slice(0, -1).map((crumb, index) => (
                    <React.Fragment key={`${crumb.path}-${index}`}>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link
                            to={crumb.path}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {crumb.label}
                          </Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      {index < breadcrumbs.slice(0, -1).length - 1 && (
                        <BreadcrumbSeparator />
                      )}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Quick Create Menu */}
          {quickCreateActions.length > 0 && (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="default"
                      size="icon"
                      className="h-9 w-9 bg-primary hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">Quick Create</span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Quick Create</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Quick Create</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {quickCreateActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <DropdownMenuItem
                      key={action.path}
                      asChild
                      className="cursor-pointer"
                    >
                      <Link to={action.path}>
                        <Icon className="mr-2 h-4 w-4" />
                        <span>{action.label}</span>
                        {action.shortcut && (
                          <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Search */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
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

          {/* Keyboard Shortcuts Help */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hidden sm:flex"
                onClick={() => setShortcutsOpen(true)}
              >
                <Keyboard className="h-4 w-4" />
                <span className="sr-only">Keyboard Shortcuts</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Keyboard Shortcuts (⌘?)</p>
            </TooltipContent>
          </Tooltip>

          {/* Online Status - Desktop Only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 flex-shrink-0">
                {isOnline ? (
                  <Wifi className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
                )}
                <span className="text-xs font-medium whitespace-nowrap">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isOnline ? 'System is online' : 'System is offline'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Clock - Desktop Only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden xl:flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50 text-xs flex-shrink-0">
                <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="font-mono font-medium leading-none">
                  {formatTime(currentTime)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Current Time</p>
            </TooltipContent>
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                disabled={!themeMounted}
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isDark ? 'Switch to light mode' : 'Switch to dark mode'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Notifications */}
          <div className="flex-shrink-0">
            <NotificationCenter />
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar className="h-9 w-9">
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
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
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
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Command Palette (Search Dialog) */}
        <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              {searchItems.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => {
                    navigate(item.path);
                    setSearchOpen(false);
                  }}
                >
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <CommandShortcut>{item.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            {quickCreateActions.length > 0 && (
              <CommandGroup heading="Quick Create">
                {quickCreateActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <CommandItem
                      key={action.path}
                      onSelect={() => {
                        navigate(action.path);
                        setSearchOpen(false);
                      }}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{action.label}</span>
                      {action.shortcut && (
                        <CommandShortcut>{action.shortcut}</CommandShortcut>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </CommandDialog>

        {/* Keyboard Shortcuts Dialog */}
        <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Keyboard Shortcuts</DialogTitle>
              <DialogDescription>
                Use these shortcuts to navigate faster
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                {keyboardShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

