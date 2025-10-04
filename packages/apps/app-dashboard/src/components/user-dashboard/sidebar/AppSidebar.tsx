import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Package, Sun, Moon, LogOut, TriangleAlert, HelpCircle, User, Code } from 'lucide-react';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { toggleTheme } from '@/lib/theme';
import { useTheme } from '@/hooks/useTheme';
import { App } from '@/types/developer-dashboard/appTypes';
import { SidebarLogo } from './SidebarLogo';
import { useClearAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { AccountTooltip } from '@/components/shared/AccountTooltip';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
  hasVersionMismatch?: boolean;
  warningType?: 'yellow' | 'orange' | 'red' | null;
  permittedVersionEnabled?: boolean | null;
  activeVersionEnabled?: boolean | null;
}

const getMainMenuItems = (
  apps: App[],
  permittedAppVersions: Record<string, string> = {},
  appVersionsMap: Record<string, any[]> = {},
): MenuItem[] => {
  return [
    {
      id: 'apps',
      label: 'Apps',
      icon: <Package className="h-4 w-4" />,
      route: '/user/apps',
      type: 'section',
      children:
        apps.length === 0
          ? [
              {
                id: 'no-apps',
                label: 'No Apps',
                icon: <Package className="h-4 w-4 opacity-50" />,
                route: '#',
                type: 'link',
              },
            ]
          : apps.map((app) => {
              const appId = app.appId.toString();
              const permittedVersion = permittedAppVersions[appId];
              const activeVersion = app.activeVersion?.toString();
              const appVersions = appVersionsMap[appId] || [];

              // Find version objects
              const permittedVersionObj = appVersions.find(
                (v) => v.version.toString() === permittedVersion,
              );
              const activeVersionObj = appVersions.find(
                (v) => v.version.toString() === activeVersion,
              );

              // Check enabled status
              const permittedVersionEnabled = permittedVersionObj?.enabled ?? null;
              const activeVersionEnabled = activeVersionObj?.enabled ?? null;

              // Determine warning type and color
              const hasVersionMismatch = !!(
                permittedVersion &&
                activeVersion &&
                permittedVersion !== activeVersion
              );
              let warningType: 'yellow' | 'orange' | 'red' | null = null;

              // Check for version mismatch first (lowest priority)
              if (hasVersionMismatch) {
                warningType = 'yellow'; // Version mismatch - yellow warning
              }

              // Check if either version is disabled (medium priority)
              if (permittedVersionEnabled === false || activeVersionEnabled === false) {
                warningType = 'orange'; // Either version disabled - orange warning
              }

              // Check if both versions are disabled (highest priority)
              if (permittedVersionEnabled === false && activeVersionEnabled === false) {
                warningType = 'red'; // Both versions disabled - red warning
              }

              return {
                id: appId,
                label: app.name,
                icon: <SidebarLogo logo={app.logo} alt={`${app.name} logo`} />,
                route: `/user/appId/${app.appId}`,
                type: 'link' as const,
                hasVersionMismatch,
                warningType,
                permittedVersionEnabled,
                activeVersionEnabled,
              };
            }),
    },
  ];
};

interface AppSidebarProps {
  apps: App[];
  permittedAppVersions?: Record<string, string>;
  appVersionsMap?: Record<string, any[]>;
}

export function AppSidebar({
  apps = [],
  permittedAppVersions = {},
  appVersionsMap = {},
}: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearAuthInfo } = useClearAuthInfo();
  const isDark = useTheme();

  const menuItems = getMainMenuItems(apps, permittedAppVersions, appVersionsMap);

  const isActiveRoute = (route: string) => {
    return location.pathname.startsWith(route);
  };

  const handleSignOut = async () => {
    await clearAuthInfo();
  };

  const handleWarningClick = (appId: string) => {
    navigate(`/user/appId/${appId}/update-version`);
  };

  return (
    <Sidebar variant="sidebar" collapsible="offcanvas" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border h-16">
        <div className="flex items-center px-6 py-4 h-full">
          <Link to="/">
            <img
              src={isDark ? '/vincent-main-logo-white.png' : '/vincent-main-logo.png'}
              alt="Vincent by Lit Protocol"
              className="h-6 object-contain cursor-pointer"
            />
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        <SidebarGroup className="space-y-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => {
                return (
                  <SidebarMenuItem key={item.id}>
                    {item.type === 'link' ? (
                      <SidebarMenuButton
                        asChild
                        isActive={isActiveRoute(item.route)}
                        className={`h-10 px-3 rounded-lg transition-all duration-200 ${
                          isActiveRoute(item.route)
                            ? `${theme.itemBg} text-orange-500 font-semibold`
                            : `${theme.text} ${theme.itemHoverBg}`
                        }`}
                      >
                        <Link to={item.route} className="flex items-center gap-3">
                          <div
                            className={`${isActiveRoute(item.route) ? 'text-orange-500' : theme.textMuted} [&>svg]:!w-5 [&>svg]:!h-5`}
                          >
                            {item.icon}
                          </div>
                          <span
                            className={`font-medium ${isActiveRoute(item.route) ? 'text-orange-500' : theme.text}`}
                          >
                            {item.label}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    ) : (
                      <>
                        <SidebarMenuButton
                          asChild
                          isActive={isActiveRoute(item.route)}
                          className={`h-10 px-3 rounded-lg transition-all duration-200 cursor-pointer ${
                            isActiveRoute(item.route)
                              ? `${theme.itemBg} text-orange-500 font-semibold`
                              : `${theme.text} ${theme.itemHoverBg}`
                          }`}
                        >
                          <Link to={item.route} className="flex items-center gap-3 w-full">
                            <div
                              className={`${isActiveRoute(item.route) ? 'text-orange-500' : theme.textMuted} [&>svg]:!w-5 [&>svg]:!h-5`}
                            >
                              {item.icon}
                            </div>
                            <span
                              className={`font-medium ${isActiveRoute(item.route) ? 'text-orange-500' : theme.text}`}
                            >
                              {item.label}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                        <SidebarMenuSub className="ml-6 mt-2 space-y-1">
                          {item.children?.map((child) => {
                            return (
                              <SidebarMenuSubItem key={child.id} className="relative">
                                {child.warningType && (
                                  <div className="absolute left-[-40px] top-1/2 transform -translate-y-1/2 z-10">
                                    <div className="relative group/triangle">
                                      <TriangleAlert
                                        className={`h-4 w-4 transition-colors cursor-pointer ${
                                          child.warningType === 'yellow'
                                            ? 'text-yellow-500 hover:text-yellow-400'
                                            : child.warningType === 'orange'
                                              ? 'text-orange-500 hover:text-orange-400'
                                              : child.warningType === 'red'
                                                ? 'text-red-500 hover:text-red-400'
                                                : 'text-yellow-500 hover:text-yellow-400'
                                        }`}
                                        onClick={() => handleWarningClick(child.id)}
                                      />
                                      <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover/triangle:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                                        <div className="bg-neutral-900 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap shadow-lg">
                                          {child.warningType === 'yellow' && (
                                            <>
                                              <div className="font-medium">
                                                New Version Available
                                              </div>
                                              <div className="text-gray-300">
                                                Permitted: v{permittedAppVersions[child.id]} |
                                                Active: v
                                                {
                                                  apps.find(
                                                    (app) => app.appId.toString() === child.id,
                                                  )?.activeVersion
                                                }
                                              </div>
                                            </>
                                          )}
                                          {child.warningType === 'orange' && (
                                            <>
                                              <div className="font-medium">
                                                {child.permittedVersionEnabled === false &&
                                                child.activeVersionEnabled === false
                                                  ? 'Both Versions Disabled'
                                                  : child.permittedVersionEnabled === false
                                                    ? 'Permitted Version Disabled'
                                                    : 'Active Version Disabled'}
                                              </div>
                                              <div className="text-gray-300">
                                                {child.permittedVersionEnabled === false &&
                                                child.activeVersionEnabled === false
                                                  ? `Both permitted v${permittedAppVersions[child.id]} and active v${apps.find((app) => app.appId.toString() === child.id)?.activeVersion} are disabled`
                                                  : child.permittedVersionEnabled === false
                                                    ? `Your permitted version v${permittedAppVersions[child.id]} is disabled`
                                                    : `The active version v${apps.find((app) => app.appId.toString() === child.id)?.activeVersion} is disabled`}
                                              </div>
                                            </>
                                          )}
                                          {child.warningType === 'red' && (
                                            <>
                                              <div className="font-medium">
                                                Permitted + Active Versions Disabled
                                              </div>
                                              <div className="text-gray-300">
                                                Permitted v{permittedAppVersions[child.id]} and
                                                Active v
                                                {
                                                  apps.find(
                                                    (app) => app.appId.toString() === child.id,
                                                  )?.activeVersion
                                                }{' '}
                                                are disabled
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isActiveRoute(child.route)}
                                  className={`h-10 px-3 rounded-md transition-all duration-200 ${
                                    isActiveRoute(child.route)
                                      ? `${theme.itemBg} text-orange-500 font-medium`
                                      : `${theme.textMuted} ${theme.itemHoverBg}`
                                  }`}
                                >
                                  <Link to={child.route} className="flex items-center gap-2">
                                    <div
                                      className={`${isActiveRoute(child.route) ? 'text-orange-500' : theme.textMuted} [&>svg]:!w-5 [&>svg]:!h-5`}
                                    >
                                      {child.icon}
                                    </div>
                                    <span
                                      className={`text-sm ${isActiveRoute(child.route) ? `text-orange-500 font-medium` : theme.textMuted}`}
                                    >
                                      {child.label}
                                    </span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="my-0" />

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-4 space-y-2">
          <SidebarMenu>
            {/* Dashboard Switcher */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname.startsWith('/user')}
                className={`h-10 px-3 rounded-lg transition-all duration-200 ${
                  location.pathname.startsWith('/user')
                    ? `${theme.itemBg} text-orange-500`
                    : `${theme.text} ${theme.itemHoverBg}`
                }`}
              >
                <Link to="/user/apps">
                  <div className="flex items-center gap-3">
                    <div
                      className={
                        location.pathname.startsWith('/user') ? 'text-orange-500' : theme.textMuted
                      }
                    >
                      <User className="h-4 w-4" />
                    </div>
                    <span
                      className={`font-medium ${location.pathname.startsWith('/user') ? 'text-orange-500' : theme.text}`}
                    >
                      User Dashboard
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname.startsWith('/developer')}
                className={`h-10 px-3 rounded-lg transition-all duration-200 ${
                  location.pathname.startsWith('/developer')
                    ? `${theme.itemBg} text-orange-500`
                    : `${theme.text} ${theme.itemHoverBg}`
                }`}
              >
                <Link to="/developer/dashboard">
                  <div className="flex items-center gap-3">
                    <div
                      className={
                        location.pathname.startsWith('/developer')
                          ? 'text-orange-500'
                          : theme.textMuted
                      }
                    >
                      <Code className="h-4 w-4" />
                    </div>
                    <span
                      className={`font-medium ${location.pathname.startsWith('/developer') ? 'text-orange-500' : theme.text}`}
                    >
                      Developer Dashboard
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <div className={`border-t ${isDark ? 'border-white/10' : 'border-gray-900/10'} my-2`} />

            {/* My Account with tooltip */}
            <SidebarMenuItem>
              <AccountTooltip theme={theme} />
            </SidebarMenuItem>

            {/* Sign Out */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleSignOut}
                className={`h-10 px-3 rounded-lg transition-all duration-200 ${theme.text} ${theme.itemHoverBg}`}
              >
                <div className="flex items-center gap-3">
                  <div className={theme.textMuted}>
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span className={`font-medium ${theme.text}`}>Sign out</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div className={`border-t ${isDark ? 'border-white/10' : 'border-gray-900/10'} my-2`} />

          <SidebarMenu>
            {/* FAQ */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className={`h-10 px-3 rounded-lg transition-all duration-200 ${theme.text} ${theme.itemHoverBg}`}
              >
                <Link to="/faq">
                  <div className="flex items-center gap-3">
                    <div className={theme.textMuted}>
                      <HelpCircle className="h-4 w-4" />
                    </div>
                    <span className={`font-medium ${theme.text}`}>FAQ</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Theme Toggle */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={toggleTheme}
                className={`h-10 px-3 rounded-lg transition-all duration-200 ${theme.text} ${theme.itemHoverBg}`}
              >
                <div className="flex items-center gap-3">
                  <div className={theme.textMuted}>
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </div>
                  <span className={`font-medium ${theme.text}`}>
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
