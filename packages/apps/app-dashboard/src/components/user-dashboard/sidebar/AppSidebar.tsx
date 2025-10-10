import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Package, Sun, Moon, LogOut, HelpCircle, User, Code } from 'lucide-react';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { toggleTheme } from '@/lib/theme';
import { useTheme } from '@/hooks/useTheme';
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
  SidebarSeparator,
} from '@/components/shared/ui/sidebar';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'apps',
    label: 'Apps',
    icon: <Package className="h-4 w-4" />,
    route: '/user/apps',
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { clearAuthInfo } = useClearAuthInfo();
  const isDark = useTheme();

  const isActiveRoute = (route: string) => {
    return location.pathname.startsWith(route);
  };

  const handleSignOut = async () => {
    await clearAuthInfo();
  };

  return (
    <Sidebar
      variant="sidebar"
      collapsible="offcanvas"
      className="border-r-0 bg-white dark:bg-gray-950"
    >
      <SidebarHeader className="border-b border-sidebar-border h-16">
        <div className="flex items-center px-6 py-4 h-full">
          <Link to="/">
            <img
              src={isDark ? '/vincent-main-logo-white.png' : '/vincent-main-logo.png'}
              alt="Vincent by Lit Protocol"
              className="h-8 object-contain cursor-pointer"
            />
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        <SidebarGroup className="space-y-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActiveRoute(item.route)}
                    className={`h-10 px-3 rounded-lg transition-all duration-200 ${
                      isActiveRoute(item.route)
                        ? `${theme.itemBg} font-semibold`
                        : `${theme.text} ${theme.itemHoverBg}`
                    }`}
                    style={fonts.heading}
                  >
                    <Link to={item.route} className="flex items-center gap-3">
                      <div
                        className={`${isActiveRoute(item.route) ? '' : theme.textMuted} [&>svg]:!w-5 [&>svg]:!h-5`}
                        style={isActiveRoute(item.route) ? { color: theme.brandOrange } : {}}
                      >
                        {item.icon}
                      </div>
                      <span
                        className={`font-medium ${isActiveRoute(item.route) ? '' : theme.text}`}
                        style={isActiveRoute(item.route) ? { color: theme.brandOrange } : {}}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
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
            {/* Dashboard Switcher */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname.startsWith('/user')}
                className={`h-10 px-3 rounded-lg transition-all duration-200 ${
                  location.pathname.startsWith('/user')
                    ? `${theme.itemBg}`
                    : `${theme.text} ${theme.itemHoverBg}`
                }`}
                style={fonts.heading}
              >
                <Link to="/user/apps">
                  <div className="flex items-center gap-3">
                    <div
                      className={location.pathname.startsWith('/user') ? '' : theme.textMuted}
                      style={
                        location.pathname.startsWith('/user') ? { color: theme.brandOrange } : {}
                      }
                    >
                      <User className="h-4 w-4" />
                    </div>
                    <span
                      className={`font-medium ${location.pathname.startsWith('/user') ? '' : theme.text}`}
                      style={
                        location.pathname.startsWith('/user') ? { color: theme.brandOrange } : {}
                      }
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
                className={`h-auto py-2 px-3 rounded-lg transition-all duration-200 ${
                  location.pathname.startsWith('/developer')
                    ? `${theme.itemBg}`
                    : `${theme.text} ${theme.itemHoverBg}`
                }`}
                style={fonts.heading}
              >
                <Link to="/developer/dashboard">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex-shrink-0 ${
                        location.pathname.startsWith('/developer') ? '' : theme.textMuted
                      }`}
                      style={
                        location.pathname.startsWith('/developer')
                          ? { color: theme.brandOrange }
                          : {}
                      }
                    >
                      <Code className="h-4 w-4" />
                    </div>
                    <span
                      className={`font-medium leading-tight ${location.pathname.startsWith('/developer') ? '' : theme.text}`}
                      style={
                        location.pathname.startsWith('/developer')
                          ? { color: theme.brandOrange }
                          : {}
                      }
                    >
                      Developer
                      <br />
                      Dashboard
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
                style={fonts.heading}
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
                style={fonts.heading}
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
                style={fonts.heading}
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
