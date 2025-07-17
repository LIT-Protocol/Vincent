import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Smartphone, Wallet, Loader2, Sun, Moon, LogOut, ChevronRight } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { theme } from '../consent/ui/theme';
import { App } from '@/types/developer-dashboard/appTypes';
import { Logo } from '@/components/shared/ui/Logo';
import { useClearAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { AccountTooltip } from '../sidebar/AccountTooltip';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
} from '@/components/shared/ui/sidebar';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  type: 'link' | 'section';
  children?: MenuItem[];
}

const getMainMenuItems = (apps: App[], isLoadingApps: boolean): MenuItem[] => [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home className="h-4 w-4" />,
    route: '/user',
    type: 'link',
  },
  {
    id: 'apps',
    label: 'Apps',
    icon: <Smartphone className="h-4 w-4" />,
    route: '/user/apps',
    type: 'section',
    children: isLoadingApps
      ? [
          {
            id: 'loading',
            label: 'Loading...',
            icon: <Loader2 className="h-4 w-4 animate-spin" />,
            route: '#',
            type: 'link',
          },
        ]
      : apps.length === 0
        ? [
            {
              id: 'no-apps',
              label: 'No Apps Found',
              icon: <Smartphone className="h-4 w-4 opacity-50" />,
              route: '#',
              type: 'link',
            },
          ]
        : apps.map((app) => ({
            id: app.appId.toString(),
            label: app.name,
            icon: <Logo logo={app.logo} alt={`${app.name} logo`} className="w-4 h-4 rounded" />,
            route: `/user/appId/${app.appId}`,
            type: 'link' as const,
          })),
  },
];

interface AppSidebarProps {
  apps: App[];
  isLoadingApps?: boolean;
}

export function AppSidebar({ apps = [], isLoadingApps = false }: AppSidebarProps) {
  const { isDark, toggleTheme } = useTheme();
  const themeStyles = theme(isDark);
  const location = useLocation();
  const { clearAuthInfo } = useClearAuthInfo();

  const menuItems = getMainMenuItems(apps, isLoadingApps);

  const isActiveRoute = (route: string) => {
    if (route === '/user') {
      return location.pathname === '/user';
    }
    return location.pathname.startsWith(route);
  };

  const handleSignOut = async () => {
    await clearAuthInfo();
    window.location.reload();
  };

  return (
    <Sidebar variant="sidebar" collapsible="offcanvas" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border h-16">
        <div className="flex items-center px-6 py-4 h-full">
          <img
            src={isDark ? '/vincent-by-lit-white-logo.png' : '/vincent-by-lit-logo.png'}
            alt="Vincent by Lit Protocol"
            className="h-8"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        <SidebarGroup className="space-y-4">
          <SidebarGroupLabel
            className={`px-3 text-sm font-semibold ${themeStyles.text} uppercase tracking-wide`}
          >
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  {item.type === 'link' ? (
                    <SidebarMenuButton
                      asChild
                      isActive={isActiveRoute(item.route)}
                      className={`h-10 px-3 rounded-lg transition-all duration-200 ${
                        isActiveRoute(item.route)
                          ? `${themeStyles.itemBg} text-orange-500 font-semibold`
                          : `${themeStyles.text} ${themeStyles.itemHoverBg}`
                      }`}
                    >
                      <Link to={item.route} className="flex items-center gap-3">
                        <div
                          className={`${isActiveRoute(item.route) ? 'text-orange-500' : themeStyles.textMuted}`}
                        >
                          {item.icon}
                        </div>
                        <span
                          className={`font-medium ${isActiveRoute(item.route) ? 'text-orange-500' : themeStyles.text}`}
                        >
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <>
                      <SidebarMenuButton
                        isActive={isActiveRoute(item.route)}
                        className={`h-10 px-3 rounded-lg transition-all duration-200 cursor-pointer ${
                          isActiveRoute(item.route)
                            ? `${themeStyles.itemBg} text-orange-500 font-semibold`
                            : `${themeStyles.text} ${themeStyles.itemHoverBg}`
                        }`}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div
                            className={`${isActiveRoute(item.route) ? 'text-orange-500' : themeStyles.textMuted}`}
                          >
                            {item.icon}
                          </div>
                          <span
                            className={`font-medium ${isActiveRoute(item.route) ? 'text-orange-500' : themeStyles.text}`}
                          >
                            {item.label}
                          </span>
                        </div>
                        <SidebarMenuAction asChild>
                          <ChevronRight
                            className={`h-4 w-4 ${themeStyles.textSubtle} transition-transform duration-200 group-data-[state=open]:rotate-90`}
                          />
                        </SidebarMenuAction>
                      </SidebarMenuButton>
                      <SidebarMenuSub className="ml-6 mt-2 space-y-1">
                        {item.children?.map((child) => (
                          <SidebarMenuSubItem key={child.id}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActiveRoute(child.route)}
                              className={`h-8 px-3 rounded-md transition-all duration-200 ${
                                isActiveRoute(child.route)
                                  ? `${themeStyles.itemBg} text-orange-500 font-medium`
                                  : `${themeStyles.textMuted} ${themeStyles.itemHoverBg}`
                              }`}
                            >
                              <Link to={child.route} className="flex items-center gap-2">
                                <div
                                  className={`${isActiveRoute(child.route) ? 'text-orange-500' : themeStyles.textMuted}`}
                                >
                                  {child.icon}
                                </div>
                                <span
                                  className={`text-sm ${isActiveRoute(child.route) ? `text-orange-500 font-medium` : themeStyles.textMuted}`}
                                >
                                  {child.label}
                                </span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="my-0" />

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-4 space-y-2">
          <SidebarMenu>
            {/* Wallet */}
            <SidebarMenuItem>
              <SidebarMenuButton
                className={`h-10 px-3 rounded-lg transition-all duration-200 ${themeStyles.text} ${themeStyles.itemHoverBg}`}
              >
                <div className="flex items-center gap-3">
                  <div className={themeStyles.textMuted}>
                    <Wallet className="h-4 w-4" />
                  </div>
                  <span className={`font-medium ${themeStyles.text}`}>Wallet</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* My Account with tooltip */}
            <SidebarMenuItem>
              <AccountTooltip />
            </SidebarMenuItem>

            {/* Sign Out */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleSignOut}
                className={`h-10 px-3 rounded-lg transition-all duration-200 ${themeStyles.text} ${themeStyles.itemHoverBg}`}
              >
                <div className="flex items-center gap-3">
                  <div className={themeStyles.textMuted}>
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span className={`font-medium ${themeStyles.text}`}>Sign out</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div className={`border-t ${isDark ? 'border-white/10' : 'border-gray-900/10'} my-2`} />

          <SidebarMenu>
            {/* Theme Toggle */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={toggleTheme}
                className={`h-10 px-3 rounded-lg transition-all duration-200 ${themeStyles.text} ${themeStyles.itemHoverBg}`}
              >
                <div className="flex items-center gap-3">
                  <div className={themeStyles.textMuted}>
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </div>
                  <span className={`font-medium ${themeStyles.text}`}>
                    {isDark ? 'Light mode' : 'Dark mode'}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
