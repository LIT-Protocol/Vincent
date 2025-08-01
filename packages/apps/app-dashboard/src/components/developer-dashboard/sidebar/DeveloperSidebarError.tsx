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
  Copy,
} from 'lucide-react';
import useReadAuthInfo, { useClearAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
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
  SidebarSeparator,
} from '@/components/shared/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/shared/ui/tooltip';

type DeveloperSidebarErrorProps = {
  error: string;
};

export function DeveloperSidebarError({ error }: DeveloperSidebarErrorProps) {
  // Removed isDark and themeStyles since developer dashboard doesn't have theme toggle (yet)
  const location = useLocation();
  const { authInfo } = useReadAuthInfo();
  const { clearAuthInfo } = useClearAuthInfo();

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

  const handleCopyEthAddress = async () => {
    if (authInfo?.agentPKP?.ethAddress) {
      try {
        await navigator.clipboard.writeText(authInfo.agentPKP.ethAddress);
      } catch (err) {
        console.error('Failed to copy eth address:', err);
      }
    }
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
              src="/vincent-by-lit-logo.png"
              alt="Vincent by Lit Protocol"
              className="h-8 object-contain cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        <SidebarGroup className="space-y-4">
          <SidebarGroupLabel className="px-3 text-sm font-semibold text-black uppercase tracking-wide">
            Developer Abilities
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {/* Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActiveRoute('/developer/dashboard')}
                  className={`h-10 px-3 rounded-lg transition-all duration-200 ${
                    isActiveRoute('/developer/dashboard')
                      ? `bg-gray-100/50 text-orange-500 font-semibold`
                      : `text-black hover:bg-gray-100`
                  }`}
                >
                  <Link to="/developer/dashboard" className="flex items-center gap-3">
                    <div
                      className={`${
                        isActiveRoute('/developer/dashboard') ? 'text-orange-500' : 'text-gray-600'
                      } [&>svg]:!w-5 [&>svg]:!h-5`}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                    </div>
                    <span
                      className={`font-medium ${
                        isActiveRoute('/developer/dashboard') ? 'text-orange-500' : 'text-black'
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
                      ? `bg-gray-100/50 text-orange-500 font-semibold`
                      : `text-black hover:bg-gray-100`
                  }`}
                >
                  <Link to="/developer/apps" className="flex items-center gap-3">
                    <div
                      className={`${
                        isActiveRoute('/developer/apps') ? 'text-orange-500' : 'text-gray-600'
                      } [&>svg]:!w-5 [&>svg]:!h-5`}
                    >
                      <SquareStack className="h-4 w-4" />
                    </div>
                    <span
                      className={`font-medium ${
                        isActiveRoute('/developer/apps') ? 'text-orange-500' : 'text-black'
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
                      ? `bg-gray-100/50 text-orange-500 font-semibold`
                      : `text-black hover:bg-gray-100`
                  }`}
                >
                  <Link to="/developer/abilities" className="flex items-center gap-3">
                    <div
                      className={`${
                        isActiveRoute('/developer/abilities') ? 'text-orange-500' : 'text-gray-600'
                      } [&>svg]:!w-5 [&>svg]:!h-5`}
                    >
                      <Wrench className="h-4 w-4" />
                    </div>
                    <span
                      className={`font-medium ${
                        isActiveRoute('/developer/abilities') ? 'text-orange-500' : 'text-black'
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
                      ? `bg-gray-100/50 text-orange-500 font-semibold`
                      : `text-black hover:bg-gray-100`
                  }`}
                >
                  <Link to="/developer/policies" className="flex items-center gap-3">
                    <div
                      className={`${
                        isActiveRoute('/developer/policies') ? 'text-orange-500' : 'text-gray-600'
                      } [&>svg]:!w-5 [&>svg]:!h-5`}
                    >
                      <Shield className="h-4 w-4" />
                    </div>
                    <span
                      className={`font-medium ${
                        isActiveRoute('/developer/policies') ? 'text-orange-500' : 'text-black'
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
                onClick={() =>
                  window.open('https://docs.heyvincent.ai/documents/Getting_Started.html', '_blank')
                }
                className={`h-10 px-3 rounded-lg transition-all duration-200 text-black hover:bg-gray-100`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-gray-600">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-black">Documentation</span>
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* My Account */}
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    className={`h-10 px-3 rounded-lg transition-all duration-200 text-black hover:bg-gray-100`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-gray-600">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-black">My Account</span>
                    </div>
                  </SidebarMenuButton>
                </TooltipTrigger>

                {authInfo && (
                  <TooltipContent
                    side="top"
                    className={`bg-white border-gray-200 text-black max-w-sm`}
                  >
                    <div className="whitespace-pre-line text-xs">
                      <div className="mb-2">{formatAuthInfo()}</div>
                      {authInfo.agentPKP?.ethAddress && (
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-600">Agent PKP:</div>
                            <div className="font-mono text-xs text-black truncate">
                              {authInfo.agentPKP.ethAddress}
                            </div>
                          </div>
                          <button
                            onClick={handleCopyEthAddress}
                            className={`p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0`}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </SidebarMenuItem>

            {/* Sign Out */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleSignOut}
                className={`h-10 px-3 rounded-lg transition-all duration-200 text-black hover:bg-gray-100`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-gray-600">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-black">Sign out</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div className={`border-t border-gray-900/10 my-2`} />

          {/* Removed theme toggle since developer dashboard doesn't support theming */}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
