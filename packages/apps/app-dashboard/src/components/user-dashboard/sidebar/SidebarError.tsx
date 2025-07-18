import { useLocation, Link } from 'react-router-dom';
import { Package, Wallet, Sun, Moon, LogOut, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { theme } from '../consent/ui/theme';
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
  SidebarSeparator,
} from '@/components/shared/ui/sidebar';

interface SidebarErrorProps {
  error: string;
}

export function SidebarError({ error }: SidebarErrorProps) {
  const { isDark, toggleTheme } = useTheme();
  const themeStyles = theme(isDark);
  const location = useLocation();
  const { clearAuthInfo } = useClearAuthInfo();

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
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActiveRoute('/user/apps')}
                  className={`h-10 px-3 rounded-lg transition-all duration-200 ${
                    isActiveRoute('/user/apps')
                      ? `${themeStyles.itemBg} text-orange-500 font-semibold`
                      : `${themeStyles.text} ${themeStyles.itemHoverBg}`
                  }`}
                >
                  <Link to="/user/apps" className="flex items-center gap-3 w-full">
                    <div
                      className={`${isActiveRoute('/user/apps') ? 'text-orange-500' : themeStyles.textMuted} [&>svg]:!w-5 [&>svg]:!h-5`}
                    >
                      <Package className="h-4 w-4" />
                    </div>
                    <span
                      className={`font-medium ${isActiveRoute('/user/apps') ? 'text-orange-500' : themeStyles.text}`}
                    >
                      Apps
                    </span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuSub className="ml-6 mt-2 space-y-1">
                  <SidebarMenuSubItem>
                    <div className="p-3 rounded-md border border-destructive/20 bg-destructive/5">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-destructive" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-destructive">
                            Failed to load apps
                          </p>
                          <p className="text-xs text-muted-foreground">{error}</p>
                        </div>
                      </div>
                    </div>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
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
