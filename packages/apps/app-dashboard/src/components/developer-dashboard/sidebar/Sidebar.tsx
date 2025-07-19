import {
  SquareStack,
  LayoutDashboard,
  Wrench,
  Shield,
  BookOpen,
  LogOut,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  FileText,
  GitBranch,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import { theme } from '@/components/user-dashboard/consent/ui/theme';
import { useClearAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { AccountTooltip } from '@/components/user-dashboard/sidebar/AccountTooltip';
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/shared/ui/sidebar';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { App, Tool, Policy } from '@/types/developer-dashboard/appTypes';

interface SidebarProps {
  userApps: App[];
  userTools: Tool[];
  userPolicies: Policy[];
}

export function Sidebar({ userApps, userTools, userPolicies }: SidebarProps) {
  const { isDark } = useTheme(); // TODO: Add light/dark mode to the developer dashboard
  const themeStyles = theme(isDark);
  const location = useLocation();
  const params = useParams();
  const { clearAuthInfo } = useClearAuthInfo();

  // Simple state for user interactions (like user sidebar)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [hasInitialized, setHasInitialized] = useState(false);

  // Get the currently active app, tool, policy from route params
  const activeAppId = params.appId ? parseInt(params.appId) : null;
  const activeToolPackageName = params.toolId ? decodeURIComponent(params.toolId) : null;
  const activePolicyPackageName = params.policyId ? decodeURIComponent(params.policyId) : null;

  // Fetch versions only for active items
  // FIXME: I couldn't find a better way to do this. Otherwise we have a dynamic number of queries,
  // or the cache invalidation doesn't work with lazy queries.
  const { data: activeAppVersions } = vincentApiClient.useGetAppVersionsQuery(
    { appId: activeAppId || 0 },
    { skip: !activeAppId },
  );

  const { data: activeToolVersions } = vincentApiClient.useGetToolVersionsQuery(
    { packageName: activeToolPackageName || '' },
    { skip: !activeToolPackageName },
  );

  const { data: activePolicyVersions } = vincentApiClient.useGetPolicyVersionsQuery(
    { packageName: activePolicyPackageName || '' },
    { skip: !activePolicyPackageName },
  );

  // Initialize expanded menus based on current route - but only once
  useEffect(() => {
    if (hasInitialized) return; // Don't override user choices after initial load

    const path = location.pathname;
    const initialExpanded = new Set<string>();

    if (
      path.startsWith('/developer/apps') ||
      path.includes('/appId/') ||
      path.startsWith('/developer/create-app')
    ) {
      initialExpanded.add('apps');

      // Also expand app versions if we're on a version page
      if (path.includes('/version/') || path.includes('/versions')) {
        initialExpanded.add('app-versions');
      }
    }
    if (
      path.startsWith('/developer/tools') ||
      path.includes('/toolId/') ||
      path.startsWith('/developer/create-tool')
    ) {
      initialExpanded.add('tools');

      // Also expand tool versions if we're on a version page
      if (path.includes('/version/') || path.includes('/versions')) {
        initialExpanded.add('tool-versions');
      }
    }
    if (
      path.startsWith('/developer/policies') ||
      path.includes('/policyId/') ||
      path.startsWith('/developer/create-policy')
    ) {
      initialExpanded.add('policies');

      // Also expand policy versions if we're on a version page
      if (path.includes('/version/') || path.includes('/versions')) {
        initialExpanded.add('policy-versions');
      }
    }

    setExpandedMenus(initialExpanded);
    setHasInitialized(true);
  }, [location.pathname, hasInitialized]);

  // Simple expansion check - just use state
  const shouldExpandMenu = (menuId: string) => {
    return expandedMenus.has(menuId);
  };

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

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  // Render functions for each section
  const renderAppList = () => {
    if (!userApps || userApps.length === 0) {
      return <div className="ml-4 mt-1 px-3 py-2 text-xs text-black opacity-75">No apps found</div>;
    }

    return (
      <div className="ml-4 mt-1 space-y-1">
        {userApps.map((app: App) => {
          const appRoute = `/developer/appId/${app.appId}`;
          const isAppActive = isActiveRoute(appRoute);
          const appVersions = activeAppVersions || [];

          return (
            <div key={app.appId}>
              <SidebarMenuSubButton
                asChild
                className={`h-12 px-3 rounded-lg transition-all duration-200 text-xs w-full cursor-pointer ${
                  isAppActive
                    ? `${themeStyles.itemBg} text-orange-500 font-semibold`
                    : `text-black ${themeStyles.itemHoverBg}`
                }`}
              >
                <Link to={appRoute}>
                  <div className="flex flex-col gap-1 flex-1 text-left">
                    <span
                      className={`font-medium truncate ${
                        isAppActive ? 'text-orange-500' : 'text-black'
                      }`}
                    >
                      {app.name}
                    </span>
                    <span
                      className={`text-xs opacity-75 truncate ${
                        isAppActive ? 'text-orange-500' : 'text-black'
                      }`}
                    >
                      ID: {app.appId}
                    </span>
                  </div>
                </Link>
              </SidebarMenuSubButton>

              {/* Show app details/versions when app is active */}
              {isAppActive && (
                <div className="ml-4 mt-2 space-y-1">
                  {/* App Details */}
                  <SidebarMenuSubButton
                    asChild
                    className={`h-8 px-3 rounded-lg transition-all duration-200 text-xs w-full cursor-pointer ${
                      isActiveRoute(appRoute) &&
                      !location.pathname.includes('/versions') &&
                      !location.pathname.includes('/version/')
                        ? `${themeStyles.itemBg} text-orange-500 font-semibold`
                        : `text-black ${themeStyles.itemHoverBg}`
                    }`}
                  >
                    <Link to={appRoute}>
                      <FileText
                        className={`h-3 w-3 mr-2 ${
                          isActiveRoute(appRoute) &&
                          !location.pathname.includes('/versions') &&
                          !location.pathname.includes('/version/')
                            ? '!text-orange-500'
                            : '!text-black'
                        }`}
                      />
                      <span
                        className={
                          isActiveRoute(appRoute) &&
                          !location.pathname.includes('/versions') &&
                          !location.pathname.includes('/version/')
                            ? 'text-orange-500'
                            : 'text-black'
                        }
                      >
                        App Details
                      </span>
                    </Link>
                  </SidebarMenuSubButton>

                  {/* App Versions */}
                  <SidebarMenuSubButton
                    onClick={() => toggleMenu('app-versions')}
                    className={`h-8 px-3 rounded-lg transition-all duration-200 text-xs w-full cursor-pointer ${
                      isActiveRoute(`${appRoute}/versions`)
                        ? `${themeStyles.itemBg} text-orange-500 font-semibold`
                        : `text-black ${themeStyles.itemHoverBg}`
                    }`}
                  >
                    <GitBranch
                      className={`h-3 w-3 mr-2 ${
                        isActiveRoute(`${appRoute}/versions`) ? '!text-orange-500' : '!text-black'
                      }`}
                    />
                    <span
                      className={
                        isActiveRoute(`${appRoute}/versions`) ? 'text-orange-500' : 'text-black'
                      }
                    >
                      App Versions
                    </span>
                    <div className="ml-auto">
                      {expandedMenus.has('app-versions') ? (
                        <ChevronDown className="h-3 w-3 !text-black" />
                      ) : (
                        <ChevronRight className="h-3 w-3 !text-black" />
                      )}
                    </div>
                  </SidebarMenuSubButton>

                  {/* Individual Versions */}
                  {expandedMenus.has('app-versions') && (
                    <div className="ml-4 mt-1 space-y-1">
                      {appVersions.length > 0 ? (
                        appVersions.map((version) => (
                          <SidebarMenuSubButton
                            key={version.version}
                            asChild
                            className={`h-7 px-3 rounded-lg transition-all duration-200 text-xs w-full cursor-pointer ${
                              isActiveRoute(`${appRoute}/version/${version.version}`)
                                ? `${themeStyles.itemBg} text-orange-500 font-semibold`
                                : `text-black ${themeStyles.itemHoverBg}`
                            }`}
                          >
                            <Link to={`${appRoute}/version/${version.version}`}>
                              <span
                                className={
                                  isActiveRoute(`${appRoute}/version/${version.version}`)
                                    ? 'text-orange-500'
                                    : 'text-black'
                                }
                              >
                                Version {version.version}
                                {version.version === app.activeVersion && (
                                  <span className="ml-2 text-xs opacity-75">(Active)</span>
                                )}
                              </span>
                            </Link>
                          </SidebarMenuSubButton>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-black opacity-75">
                          No versions available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderToolList = () => {
    if (!userTools || userTools.length === 0) {
      return (
        <div className="ml-4 mt-1 px-3 py-2 text-xs text-black opacity-75">No tools found</div>
      );
    }

    return (
      <div className="ml-4 mt-1 space-y-1">
        {userTools.map((tool: Tool) => {
          const toolRoute = `/developer/toolId/${encodeURIComponent(tool.packageName)}`;
          const isToolActive = isActiveRoute(toolRoute);
          const toolVersions = activeToolVersions || [];

          return (
            <div key={tool.packageName}>
              <SidebarMenuSubButton
                asChild
                className={`h-12 px-3 rounded-lg transition-all duration-200 text-xs w-full cursor-pointer ${
                  isToolActive
                    ? `${themeStyles.itemBg} text-orange-500 font-semibold`
                    : `text-black ${themeStyles.itemHoverBg}`
                }`}
              >
                <Link to={toolRoute}>
                  <div className="flex flex-col gap-1 flex-1 text-left">
                    <span
                      className={`font-medium truncate ${
                        isToolActive ? 'text-orange-500' : 'text-black'
                      }`}
                    >
                      {tool.title}
                    </span>
                    <span
                      className={`text-xs opacity-75 truncate ${
                        isToolActive ? 'text-orange-500' : 'text-black'
                      }`}
                    >
                      {tool.packageName}
                    </span>
                  </div>
                </Link>
              </SidebarMenuSubButton>

              {/* Show tool details/versions when tool is active */}
              {isToolActive && (
                <div className="ml-4 mt-2 space-y-1">
                  {/* Tool Details */}
                  <SidebarMenuSubButton
                    asChild
                    className={`h-8 px-3 rounded-lg transition-all duration-200 text-xs w-full cursor-pointer ${
                      isActiveRoute(toolRoute) &&
                      !location.pathname.includes('/versions') &&
                      !location.pathname.includes('/version/')
                        ? `${themeStyles.itemBg} text-orange-500 font-semibold`
                        : `text-black ${themeStyles.itemHoverBg}`
                    }`}
                  >
                    <Link to={toolRoute}>
                      <FileText
                        className={`h-3 w-3 mr-2 ${
                          isActiveRoute(toolRoute) &&
                          !location.pathname.includes('/versions') &&
                          !location.pathname.includes('/version/')
                            ? '!text-orange-500'
                            : '!text-black'
                        }`}
                      />
                      <span
                        className={
                          isActiveRoute(toolRoute) &&
                          !location.pathname.includes('/versions') &&
                          !location.pathname.includes('/version/')
                            ? 'text-orange-500'
                            : 'text-black'
                        }
                      >
                        Tool Details
                      </span>
                    </Link>
                  </SidebarMenuSubButton>

                  {/* Tool Versions */}
                  <SidebarMenuSubButton
                    onClick={() => toggleMenu('tool-versions')}
                    className={`h-8 px-3 rounded-lg transition-all duration-200 text-xs w-full cursor-pointer ${
                      isActiveRoute(`${toolRoute}/versions`)
                        ? `${themeStyles.itemBg} text-orange-500 font-semibold`
                        : `text-black ${themeStyles.itemHoverBg}`
                    }`}
                  >
                    <GitBranch
                      className={`h-3 w-3 mr-2 ${
                        isActiveRoute(`${toolRoute}/versions`) ? '!text-orange-500' : '!text-black'
                      }`}
                    />
                    <span
                      className={
                        isActiveRoute(`${toolRoute}/versions`) ? 'text-orange-500' : 'text-black'
                      }
                    >
                      Tool Versions
                    </span>
                    <div className="ml-auto">
                      {expandedMenus.has('tool-versions') ? (
                        <ChevronDown className="h-3 w-3 !text-black" />
                      ) : (
                        <ChevronRight className="h-3 w-3 !text-black" />
                      )}
                    </div>
                  </SidebarMenuSubButton>

                  {/* Individual Versions */}
                  {expandedMenus.has('tool-versions') && (
                    <div className="ml-4 mt-1 space-y-1">
                      {toolVersions.length > 0 ? (
                        toolVersions.map((version) => (
                          <SidebarMenuSubButton
                            key={version.version}
                            asChild
                            className={`h-7 px-3 rounded-lg transition-all duration-200 text-xs w-full cursor-pointer ${
                              isActiveRoute(`${toolRoute}/version/${version.version}`)
                                ? `${themeStyles.itemBg} text-orange-500 font-semibold`
                                : `text-black ${themeStyles.itemHoverBg}`
                            }`}
                          >
                            <Link to={`${toolRoute}/version/${version.version}`}>
                              <span
                                className={
                                  isActiveRoute(`${toolRoute}/version/${version.version}`)
                                    ? 'text-orange-500'
                                    : 'text-black'
                                }
                              >
                                Version {version.version}
                                {version.version === tool.activeVersion && (
                                  <span className="ml-2 text-xs opacity-75">(Active)</span>
                                )}
                              </span>
                            </Link>
                          </SidebarMenuSubButton>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-black opacity-75">
                          No versions available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderPolicyList = () => {
    if (!userPolicies || userPolicies.length === 0) {
      return (
        <div className="ml-4 mt-1 px-3 py-2 text-xs text-black opacity-75">No policies found</div>
      );
    }

    return (
      <div className="ml-4 mt-1 space-y-1">
        {userPolicies.map((policy: Policy) => {
          const policyRoute = `/developer/policyId/${encodeURIComponent(policy.packageName)}`;
          const isPolicyActive = isActiveRoute(policyRoute);
          const policyVersions = activePolicyVersions || [];

          return (
            <div key={policy.packageName}>
              <SidebarMenuSubButton
                asChild
                className={`h-12 px-3 rounded-lg transition-all duration-200 text-xs w-full cursor-pointer ${
                  isPolicyActive
                    ? `${themeStyles.itemBg} text-orange-500 font-semibold`
                    : `text-black ${themeStyles.itemHoverBg}`
                }`}
              >
                <Link to={policyRoute}>
                  <div className="flex flex-col gap-1 flex-1 text-left">
                    <span
                      className={`font-medium truncate ${
                        isPolicyActive ? 'text-orange-500' : 'text-black'
                      }`}
                    >
                      {policy.title}
                    </span>
                    <span
                      className={`text-xs opacity-75 truncate ${
                        isPolicyActive ? 'text-orange-500' : 'text-black'
                      }`}
                    >
                      {policy.packageName}
                    </span>
                  </div>
                </Link>
              </SidebarMenuSubButton>

              {/* Show policy details/versions when policy is active */}
              {isPolicyActive && (
                <div className="ml-4 mt-2 space-y-1">
                  {/* Policy Details */}
                  <SidebarMenuSubButton
                    asChild
                    className={`h-8 px-3 rounded-lg transition-all duration-200 text-xs w-full cursor-pointer ${
                      isActiveRoute(policyRoute) &&
                      !location.pathname.includes('/versions') &&
                      !location.pathname.includes('/version/')
                        ? `${themeStyles.itemBg} text-orange-500 font-semibold`
                        : `text-black ${themeStyles.itemHoverBg}`
                    }`}
                  >
                    <Link to={policyRoute}>
                      <FileText
                        className={`h-3 w-3 mr-2 ${
                          isActiveRoute(policyRoute) &&
                          !location.pathname.includes('/versions') &&
                          !location.pathname.includes('/version/')
                            ? '!text-orange-500'
                            : '!text-black'
                        }`}
                      />
                      <span
                        className={
                          isActiveRoute(policyRoute) &&
                          !location.pathname.includes('/versions') &&
                          !location.pathname.includes('/version/')
                            ? 'text-orange-500'
                            : 'text-black'
                        }
                      >
                        Policy Details
                      </span>
                    </Link>
                  </SidebarMenuSubButton>

                  {/* Policy Versions */}
                  <SidebarMenuSubButton
                    onClick={() => toggleMenu('policy-versions')}
                    className={`h-8 px-3 rounded-lg transition-all duration-200 text-xs w-full cursor-pointer ${
                      isActiveRoute(`${policyRoute}/versions`)
                        ? `${themeStyles.itemBg} text-orange-500 font-semibold`
                        : `text-black ${themeStyles.itemHoverBg}`
                    }`}
                  >
                    <GitBranch
                      className={`h-3 w-3 mr-2 ${
                        isActiveRoute(`${policyRoute}/versions`)
                          ? '!text-orange-500'
                          : '!text-black'
                      }`}
                    />
                    <span
                      className={
                        isActiveRoute(`${policyRoute}/versions`) ? 'text-orange-500' : 'text-black'
                      }
                    >
                      Policy Versions
                    </span>
                    <div className="ml-auto">
                      {expandedMenus.has('policy-versions') ? (
                        <ChevronDown className="h-3 w-3 !text-black" />
                      ) : (
                        <ChevronRight className="h-3 w-3 !text-black" />
                      )}
                    </div>
                  </SidebarMenuSubButton>

                  {/* Individual Versions */}
                  {expandedMenus.has('policy-versions') && (
                    <div className="ml-4 mt-1 space-y-1">
                      {policyVersions.length > 0 ? (
                        policyVersions.map((version) => (
                          <SidebarMenuSubButton
                            key={version.version}
                            asChild
                            className={`h-7 px-3 rounded-lg transition-all duration-200 text-xs w-full cursor-pointer ${
                              isActiveRoute(`${policyRoute}/version/${version.version}`)
                                ? `${themeStyles.itemBg} text-orange-500 font-semibold`
                                : `text-black ${themeStyles.itemHoverBg}`
                            }`}
                          >
                            <Link to={`${policyRoute}/version/${version.version}`}>
                              <span
                                className={
                                  isActiveRoute(`${policyRoute}/version/${version.version}`)
                                    ? 'text-orange-500'
                                    : 'text-black'
                                }
                              >
                                Version {version.version}
                                {version.version === policy.activeVersion && (
                                  <span className="ml-2 text-xs opacity-75">(Active)</span>
                                )}
                              </span>
                            </Link>
                          </SidebarMenuSubButton>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-black opacity-75">
                          No versions available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const mainMenuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      route: '/developer/dashboard',
      type: 'link' as const,
    },
    {
      id: 'apps',
      label: 'Apps',
      icon: <SquareStack className="h-4 w-4" />,
      route: '/developer/apps',
      type: 'group' as const,
      children: [
        { id: 'my-apps', label: 'My Apps', route: '/developer/apps', renderList: renderAppList },
        { id: 'create-app', label: 'Create App', route: '/developer/create-app' },
      ],
    },
    {
      id: 'tools',
      label: 'Tools',
      icon: <Wrench className="h-4 w-4" />,
      route: '/developer/tools',
      type: 'group' as const,
      children: [
        {
          id: 'my-tools',
          label: 'My Tools',
          route: '/developer/tools',
          renderList: renderToolList,
        },
        { id: 'create-tool', label: 'Create Tool', route: '/developer/create-tool' },
      ],
    },
    {
      id: 'policies',
      label: 'Policies',
      icon: <Shield className="h-4 w-4" />,
      route: '/developer/policies',
      type: 'group' as const,
      children: [
        {
          id: 'my-policies',
          label: 'My Policies',
          route: '/developer/policies',
          renderList: renderPolicyList,
        },
        { id: 'create-policy', label: 'Create Policy', route: '/developer/create-policy' },
      ],
    },
  ];

  return (
    <SidebarComponent variant="sidebar" collapsible="offcanvas" className="border-r-0">
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
          <SidebarGroupLabel className="px-3 text-sm font-semibold text-black uppercase tracking-wide">
            Developer Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  {item.type === 'link' ? (
                    <SidebarMenuButton
                      asChild
                      isActive={isActiveRoute(item.route)}
                      className={`h-10 px-3 rounded-lg transition-all duration-200 ${
                        isActiveRoute(item.route)
                          ? `${themeStyles.itemBg} text-orange-500 font-semibold`
                          : `text-black ${themeStyles.itemHoverBg}`
                      }`}
                    >
                      <Link to={item.route} className="flex items-center gap-3">
                        <div
                          className={`${
                            isActiveRoute(item.route) ? 'text-orange-500' : 'text-gray-600'
                          } [&>svg]:!w-5 [&>svg]:!h-5`}
                        >
                          {item.icon}
                        </div>
                        <span
                          className={`font-medium ${
                            isActiveRoute(item.route) ? 'text-orange-500' : 'text-black'
                          }`}
                        >
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <div>
                      <SidebarMenuButton
                        onClick={() => toggleMenu(item.id)}
                        className={`h-10 px-3 rounded-lg transition-all duration-200 ${
                          isActiveRoute(item.route)
                            ? `${themeStyles.itemBg} text-orange-500 font-semibold`
                            : `text-black ${themeStyles.itemHoverBg}`
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`${
                              isActiveRoute(item.route) ? 'text-orange-500' : 'text-gray-600'
                            } [&>svg]:!w-5 [&>svg]:!h-5`}
                          >
                            {item.icon}
                          </div>
                          <span
                            className={`font-medium ${
                              isActiveRoute(item.route) ? 'text-orange-500' : 'text-black'
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>
                        <div className="text-gray-600">
                          {shouldExpandMenu(item.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </SidebarMenuButton>

                      {shouldExpandMenu(item.id) && (
                        <SidebarMenuSub className="ml-6 mt-2 space-y-1">
                          {item.children?.map((child) => (
                            <div key={child.id}>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isActiveRoute(child.route)}
                                  className={`h-9 px-3 rounded-lg transition-all duration-200 ${
                                    isActiveRoute(child.route)
                                      ? `${themeStyles.itemBg} text-orange-500 font-semibold`
                                      : `text-black ${themeStyles.itemHoverBg}`
                                  }`}
                                >
                                  <Link to={child.route} className="flex items-center gap-3">
                                    <span
                                      className={`font-medium ${
                                        isActiveRoute(child.route)
                                          ? 'text-orange-500'
                                          : 'text-black'
                                      }`}
                                    >
                                      {child.label}
                                    </span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>

                              {/* Render the section component */}
                              {child.renderList && child.renderList()}
                            </div>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </div>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-4 space-y-2">
          <SidebarMenu>
            {/* Documentation */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() =>
                  window.open('https://docs.heyvincent.ai/documents/Getting_Started.html', '_blank')
                }
                className={`h-10 px-3 rounded-lg transition-all duration-200 text-black ${themeStyles.itemHoverBg}`}
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
              <AccountTooltip />
            </SidebarMenuItem>

            {/* Sign Out */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleSignOut}
                className={`h-10 px-3 rounded-lg transition-all duration-200 text-black ${themeStyles.itemHoverBg}`}
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
        </div>
      </SidebarFooter>
    </SidebarComponent>
  );
}
