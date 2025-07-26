import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Package, Wallet, Loader2, Sun, Moon, LogOut, TriangleAlert } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { theme } from '../consent/ui/theme';
import { App } from '@/types/developer-dashboard/appTypes';
import { SidebarLogo } from './SidebarLogo';
import { useClearAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { AccountTooltip } from './AccountTooltip';
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
  isLoadingApps: boolean,
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
  isLoadingApps?: boolean;
}

export function AppSidebar({
  apps = [],
  permittedAppVersions = {},
  appVersionsMap = {},
  isLoadingApps = false,
}: AppSidebarProps) {
  const { isDark, toggleTheme } = useTheme();
  const themeStyles = theme(isDark);
  const location = useLocation();
  const navigate = useNavigate();
  const { clearAuthInfo } = useClearAuthInfo();

  const menuItems = getMainMenuItems(apps, isLoadingApps, permittedAppVersions, appVersionsMap);

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

  const handleWarningClick = (appId: string) => {
    navigate(`/user/appId/${appId}/update-version`);
  };

  return (
    <Sidebar variant="sidebar" collapsible="offcanvas" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border h-16">
        <div className="flex items-center px-6 py-4 h-full">
          <img
            src={isDark ? '/vincent-by-lit-white-logo.png' : '/vincent-by-lit-logo.png'}
            alt="Vincent by Lit Protocol"
            className="h-8 object-contain"
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
              {menuItems.map((item) => {
                return (
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
                            className={`${isActiveRoute(item.route) ? 'text-orange-500' : themeStyles.textMuted} [&>svg]:!w-5 [&>svg]:!h-5`}
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
                          asChild
                          isActive={isActiveRoute(item.route)}
                          className={`h-10 px-3 rounded-lg transition-all duration-200 cursor-pointer ${
                            isActiveRoute(item.route)
                              ? `${themeStyles.itemBg} text-orange-500 font-semibold`
                              : `${themeStyles.text} ${themeStyles.itemHoverBg}`
                          }`}
                        >
                          <Link to={item.route} className="flex items-center gap-3 w-full">
                            <div
                              className={`${isActiveRoute(item.route) ? 'text-orange-500' : themeStyles.textMuted} [&>svg]:!w-5 [&>svg]:!h-5`}
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
                                        <div className="bg-gray-900 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap shadow-lg">
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
                                      ? `${themeStyles.itemBg} text-orange-500 font-medium`
                                      : `${themeStyles.textMuted} ${themeStyles.itemHoverBg}`
                                  }`}
                                >
                                  <Link to={child.route} className="flex items-center gap-2">
                                    <div
                                      className={`${isActiveRoute(child.route) ? 'text-orange-500' : themeStyles.textMuted} [&>svg]:!w-5 [&>svg]:!h-5`}
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
            {/* Wallet */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActiveRoute('/user/wallet')}
                className={`h-10 px-3 rounded-lg transition-all duration-200 ${
                  isActiveRoute('/user/wallet')
                    ? `${themeStyles.itemBg} text-orange-500 font-semibold`
                    : `${themeStyles.text} ${themeStyles.itemHoverBg}`
                }`}
              >
                <Link to="/user/wallet" className="flex items-center gap-3">
                  <div
                    className={`${isActiveRoute('/user/wallet') ? 'text-orange-500' : themeStyles.textMuted}`}
                  >
                    <Wallet className="h-4 w-4" />
                  </div>
                  <span
                    className={`font-medium ${isActiveRoute('/user/wallet') ? 'text-orange-500' : themeStyles.text}`}
                  >
                    Wallet
                  </span>
                </Link>
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
