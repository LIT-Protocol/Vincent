import { useLocation, Link } from 'react-router-dom';
import {
  SquareStack,
  LayoutDashboard,
  Wrench,
  Shield,
  BookOpen,
  User,
  LogOut,
  AlertTriangle,
  ExternalLink,
  Sun,
  Moon,
} from 'lucide-react';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { toggleTheme } from '@/lib/theme';
import { useTheme } from '@/hooks/useTheme';
import useReadAuthInfo, { useClearAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/shared/ui/tooltip';

type DeveloperSidebarErrorProps = {
  error: string;
};

export function DeveloperSidebarError({ error }: DeveloperSidebarErrorProps) {
  const location = useLocation();
  const { authInfo } = useReadAuthInfo();
  const { clearAuthInfo } = useClearAuthInfo();
  const isDark = useTheme();

  const isActiveRoute = (route: string) => {
    if (route === '/developer/dashboard') {
      return location.pathname === '/developer/dashboard';
    }
    return location.pathname.startsWith(route);
  };

  const handleSignOut = async () => {
    await clearAuthInfo();
    window.location.reload();
  };

  const formatAuthInfo = () => {
    if (!authInfo) return '';
    return `Sign-In Type: ${authInfo.type}\nAuthenticated: ${new Date(authInfo.authenticatedAt).toLocaleString()}${authInfo.value ? `\nValue: ${authInfo.value}` : ''}`;
  };

  return (
    <Sidebar variant="sidebar" collapsible="offcanvas" className="border-r-0 w-80">
      <SidebarHeader className="border-b border-sidebar-border h-16">
        <div className="flex items-center px-6 py-4 h-full">
          <Link to="/" className="flex items-center">
            <img
              src={isDark ? '/vincent-main-logo-white.png' : '/vincent-main-logo.png'}
              alt="Vincent by Lit Protocol"
              className="h-6 object-contain cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        <SidebarGroup className="space-y-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {/* Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActiveRoute('/developer/dashboard')}
                  className={`h-10 px-3 rounded-lg transition-all duration-200 ${
                    isActiveRoute('/developer/dashboard')
                      ? `${theme.itemBg} text-orange-500 font-semibold`
                      : `${theme.text} ${theme.itemHoverBg}`
                  }`}
                >
                  <Link to="/developer/dashboard" className="flex items-center gap-3">
                    <div
                      className={`${
                        isActiveRoute('/developer/dashboard') ? 'text-orange-500' : theme.textMuted
                      } [&>svg]:!w-5 [&>svg]:!h-5`}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                    </div>
                    <span
                      className={`font-medium ${
                        isActiveRoute('/developer/dashboard') ? 'text-orange-500' : theme.text
                      }`}
                    >
                      Dashboard
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Apps */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActiveRoute('/developer/apps')}
                  className={`h-10 px-3 rounded-lg transition-all duration-200 ${
                    isActiveRoute('/developer/apps')
                      ? `${theme.itemBg} text-orange-500 font-semibold`
                      : `${theme.text} ${theme.itemHoverBg}`
                  }`}
                >
                  <Link to="/developer/apps" className="flex items-center gap-3">
                    <div
                      className={`${
                        isActiveRoute('/developer/apps') ? 'text-orange-500' : theme.textMuted
                      } [&>svg]:!w-5 [&>svg]:!h-5`}
                    >
                      <SquareStack className="h-4 w-4" />
                    </div>
                    <span
                      className={`font-medium ${
                        isActiveRoute('/developer/apps') ? 'text-orange-500' : theme.text
                      }`}
                    >
                      Apps
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Abilities */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActiveRoute('/developer/abilities')}
                  className={`h-10 px-3 rounded-lg transition-all duration-200 ${
                    isActiveRoute('/developer/abilities')
                      ? `${theme.itemBg} text-orange-500 font-semibold`
                      : `${theme.text} ${theme.itemHoverBg}`
                  }`}
                >
                  <Link to="/developer/abilities" className="flex items-center gap-3">
                    <div
                      className={`${
                        isActiveRoute('/developer/abilities') ? 'text-orange-500' : theme.textMuted
                      } [&>svg]:!w-5 [&>svg]:!h-5`}
                    >
                      <Wrench className="h-4 w-4" />
                    </div>
                    <span
                      className={`font-medium ${
                        isActiveRoute('/developer/abilities') ? 'text-orange-500' : theme.text
                      }`}
                    >
                      Abilities
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Policies */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActiveRoute('/developer/policies')}
                  className={`h-10 px-3 rounded-lg transition-all duration-200 ${
                    isActiveRoute('/developer/policies')
                      ? `${theme.itemBg} text-orange-500 font-semibold`
                      : `${theme.text} ${theme.itemHoverBg}`
                  }`}
                >
                  <Link to="/developer/policies" className="flex items-center gap-3">
                    <div
                      className={`${
                        isActiveRoute('/developer/policies') ? 'text-orange-500' : theme.textMuted
                      } [&>svg]:!w-5 [&>svg]:!h-5`}
                    >
                      <Shield className="h-4 w-4" />
                    </div>
                    <span
                      className={`font-medium ${
                        isActiveRoute('/developer/policies') ? 'text-orange-500' : theme.text
                      }`}
                    >
                      Policies
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            {/* Error Message */}
            <div className="mt-4 p-3 rounded-md border border-destructive/20 bg-destructive/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-destructive" />
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="text-sm font-medium text-destructive">
                    Failed to load developer data
                  </p>
                  <p className="text-xs text-muted-foreground break-words overflow-wrap-anywhere">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="my-0" />

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-4 space-y-2">
          <SidebarMenu>
            {/* Documentation */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => window.open('https://docs.heyvincent.ai', '_blank')}
                className={`h-10 px-3 rounded-lg transition-all duration-200 ${theme.text} ${theme.itemHoverBg}`}
              >
                <div className="flex items-center gap-3">
                  <div className="${theme.textMuted}">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <span className="font-medium ${theme.text}">Documentation</span>
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* My Account */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    className={`h-10 px-3 rounded-lg transition-all duration-200 ${theme.text} ${theme.itemHoverBg}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="${theme.textMuted}">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="font-medium ${theme.text}">My Account</span>
                    </div>
                  </SidebarMenuButton>
                </TooltipTrigger>

                {authInfo && (
                  <TooltipContent
                    side="top"
                    className={`${theme.cardBg} ${theme.cardBorder} ${theme.text} max-w-sm`}
                  >
                    <div className="whitespace-pre-line text-xs">
                      <div>{formatAuthInfo()}</div>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </SidebarMenuItem>

            {/* Sign Out */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleSignOut}
                className={`h-10 px-3 rounded-lg transition-all duration-200 ${theme.text} ${theme.itemHoverBg}`}
              >
                <div className="flex items-center gap-3">
                  <div className="${theme.textMuted}">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span className="font-medium ${theme.text}">Sign out</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div
            className={`border-t ${isDark ? 'border-white/10' : 'border-neutral-800/10'} my-2`}
          />

          <SidebarMenu>
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
