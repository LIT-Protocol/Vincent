import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Package, Wrench, Shield, LogOut, HelpCircle } from 'lucide-react';
import { theme, fonts } from '@/lib/themeClasses';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/developer-dashboard/useAuth';
import { AccountTooltip } from '@/components/shared/AccountTooltip';
import {
  Sidebar as SidebarComponent,
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

export function Sidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const isDark = useTheme();

  const isActiveRoute = (route: string) => {
    return location.pathname.startsWith(route);
  };

  const handleSignOut = () => {
    signOut();
  };

  const menuItems: MenuItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="h-4 w-4" />,
      route: '/developer/dashboard',
    },
    {
      id: 'apps',
      label: 'Apps',
      icon: <Package className="h-4 w-4" />,
      route: '/developer/apps',
    },
    {
      id: 'abilities',
      label: 'Abilities',
      icon: <Wrench className="h-4 w-4" />,
      route: '/developer/abilities',
    },
    {
      id: 'policies',
      label: 'Policies',
      icon: <Shield className="h-4 w-4" />,
      route: '/developer/policies',
    },
  ];

  return (
    <SidebarComponent
      variant="sidebar"
      collapsible="offcanvas"
      className="border-r-0 bg-white dark:bg-gray-950"
    >
      <SidebarHeader className="px-4 py-4 -mt-[61px] md:hidden mb-0 shrink-0 border-b border-gray-200 dark:border-gray-800">
        <Link to="/developer/dashboard" className="flex items-center">
          <img
            src={isDark ? '/vincent-main-logo-white.png' : '/vincent-main-logo.png'}
            alt="Vincent"
            className="h-8 w-auto"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-4 pt-4 pb-6">
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
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </SidebarComponent>
  );
}
