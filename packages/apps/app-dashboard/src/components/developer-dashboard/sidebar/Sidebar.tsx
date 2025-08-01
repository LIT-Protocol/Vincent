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
  User,
  Copy,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useClearAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/shared/ui/tooltip';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { App, Ability, Policy } from '@/types/developer-dashboard/appTypes';

interface SidebarProps {
  userApps: App[];
  userAbilities: Ability[];
  userPolicies: Policy[];
}

export function Sidebar({ userApps, userAbilities, userPolicies }: SidebarProps) {
  // Removed isDark and themeStyles since developer dashboard doesn't have theme toggle (yet)
  const location = useLocation();
  const params = useParams();
  const { clearAuthInfo } = useClearAuthInfo();

  // Simple state for user interactions (like user sidebar)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [hasInitialized, setHasInitialized] = useState(false);

  // Get the currently active app, ability, policy from route params
  const activeAppId = params.appId ? parseInt(params.appId) : null;
  const activeAbilityPackageName = params.packageName
    ? decodeURIComponent(params.packageName)
    : null;
  const activePolicyPackageName = params.packageName
    ? decodeURIComponent(params.packageName)
    : null;

  // Fetch versions only for active items
  // FIXME: I couldn't find a better way to do this. Otherwise we have a dynamic number of queries,
  // or the cache invalidation doesn't work with lazy queries.
  const { data: activeAppVersions } = vincentApiClient.useGetAppVersionsQuery(
    { appId: activeAppId || 0 },
    { skip: !activeAppId },
  );

  const { data: activeAbilityVersions } = vincentApiClient.useGetAbilityVersionsQuery(
    { packageName: activeAbilityPackageName || '' },
    { skip: !activeAbilityPackageName },
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
      path.startsWith('/developer/abilities') ||
      path.includes('/abilityId/') ||
      path.startsWith('/developer/create-ability')
    ) {
      initialExpanded.add('abilities');

      // Also expand ability versions if we're on a version page
      if (path.includes('/version/') || path.includes('/versions')) {
        initialExpanded.add('ability-versions');
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
                    ? `bg-gray-100/50 text-orange-500 font-semibold`
                    : `text-black hover:bg-gray-100`
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
                        ? `bg-gray-100/50 text-orange-500 font-semibold`
                        : `text-black hover:bg-gray-100`
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
                        ? `bg-gray-100/50 text-orange-500 font-semibold`
                        : `text-black hover:bg-gray-100`
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
                                ? `bg-gray-100/50 text-orange-500 font-semibold`
                                : `text-black hover:bg-gray-100`
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

  const renderAbilityList = () => {
    if (!userAbilities || userAbilities.length === 0) {
      return (
        <div className="ml-4 mt-1 px-3 py-2 text-xs text-black opacity-75">No abilities found</div>
      );
    }

    return (
      <div className="ml-4 mt-1 space-y-1">
        {userAbilities.map((ability: Ability) => {
          const abilityRoute = `/developer/abilityId/${encodeURIComponent(ability.packageName)}`;
          const isAbilityActive = isActiveRoute(abilityRoute);
          const abilityVersions = activeAbilityVersions || [];

          return (
            <div key={ability.packageName}>
              <SidebarMenuSubButton
                asChild
                className={`h-12 px-3 rounded-lg transition-all duration-200 text-xs w-full cursor-pointer ${
                  isAbilityActive
                    ? `bg-gray-100/50 text-orange-500 font-semibold`
                    : `text-black hover:bg-gray-100`
                }`}
              >
                <Link to={abilityRoute}>
                  <div className="flex flex-col gap-1 flex-1 text-left">
                    <span
                      className={`font-medium truncate ${
                        isAbilityActive ? 'text-orange-500' : 'text-black'
                      }`}
                    >
                      {ability.title}
                    </span>
                    <span
                      className={`text-xs opacity-75 truncate ${
                        isAbilityActive ? 'text-orange-500' : 'text-black'
                      }`}
                    >
                      {ability.packageName}
                    </span>
                  </div>
                </Link>
              </SidebarMenuSubButton>

              {/* Show ability details/versions when ability is active */}
              {isAbilityActive && (
                <div className="ml-4 mt-2 space-y-1">
                  {/* Ability Details */}
                  <SidebarMenuSubButton
                    asChild
                    className={`h-8 px-3 rounded-lg transition-all duration-200 text-xs w-full cursor-pointer ${
                      isActiveRoute(abilityRoute) &&
                      !location.pathname.includes('/versions') &&
                      !location.pathname.includes('/version/')
                        ? `bg-gray-100/50 text-orange-500 font-semibold`
                        : `text-black hover:bg-gray-100`
                    }`}
                  >
                    <Link to={abilityRoute}>
                      <FileText
                        className={`h-3 w-3 mr-2 ${
                          isActiveRoute(abilityRoute) &&
                          !location.pathname.includes('/versions') &&
                          !location.pathname.includes('/version/')
                            ? '!text-orange-500'
                            : '!text-black'
                        }`}
                      />
                      <span
                        className={
                          isActiveRoute(abilityRoute) &&
                          !location.pathname.includes('/versions') &&
                          !location.pathname.includes('/version/')
                            ? 'text-orange-500'
                            : 'text-black'
                        }
                      >
                        Ability Details
                      </span>
                    </Link>
                  </SidebarMenuSubButton>

                  {/* Ability Versions */}
                  <SidebarMenuSubButton
                    onClick={() => toggleMenu('ability-versions')}
                    className={`h-8 px-3 rounded-lg transition-all duration-200 text-xs w-full cursor-pointer ${
                      isActiveRoute(`${abilityRoute}/versions`)
                        ? `bg-gray-100/50 text-orange-500 font-semibold`
                        : `text-black hover:bg-gray-100`
                    }`}
                  >
                    <GitBranch
                      className={`h-3 w-3 mr-2 ${
                        isActiveRoute(`${abilityRoute}/versions`)
                          ? '!text-orange-500'
                          : '!text-black'
                      }`}
                    />
                    <span
                      className={
                        isActiveRoute(`${abilityRoute}/versions`) ? 'text-orange-500' : 'text-black'
                      }
                    >
                      Ability Versions
                    </span>
                    <div className="ml-auto">
                      {expandedMenus.has('ability-versions') ? (
                        <ChevronDown className="h-3 w-3 !text-black" />
                      ) : (
                        <ChevronRight className="h-3 w-3 !text-black" />
                      )}
                    </div>
                  </SidebarMenuSubButton>

                  {/* Individual Versions */}
                  {expandedMenus.has('ability-versions') && (
                    <div className="ml-4 mt-1 space-y-1">
                      {abilityVersions.length > 0 ? (
                        abilityVersions.map((version) => (
                          <SidebarMenuSubButton
                            key={version.version}
                            asChild
                            className={`h-7 px-3 rounded-lg transition-all duration-200 text-xs w-full cursor-pointer ${
                              isActiveRoute(`${abilityRoute}/version/${version.version}`)
                                ? `bg-gray-100/50 text-orange-500 font-semibold`
                                : `text-black hover:bg-gray-100`
                            }`}
                          >
                            <Link to={`${abilityRoute}/version/${version.version}`}>
                              <span
                                className={
                                  isActiveRoute(`${abilityRoute}/version/${version.version}`)
                                    ? 'text-orange-500'
                                    : 'text-black'
                                }
                              >
                                {version.version}
                                {version.version === ability.activeVersion && (
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
                    ? `bg-gray-100/50 text-orange-500 font-semibold`
                    : `text-black hover:bg-gray-100`
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
                        ? `bg-gray-100/50 text-orange-500 font-semibold`
                        : `text-black hover:bg-gray-100`
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
                        ? `bg-gray-100/50 text-orange-500 font-semibold`
                        : `text-black hover:bg-gray-100`
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
                                ? `bg-gray-100/50 text-orange-500 font-semibold`
                                : `text-black hover:bg-gray-100`
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
                                {version.version}
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
      id: 'abilities',
      label: 'Abilities',
      icon: <Wrench className="h-4 w-4" />,
      route: '/developer/abilities',
      type: 'group' as const,
      children: [
        {
          id: 'my-abilities',
          label: 'My Abilities',
          route: '/developer/abilities',
          renderList: renderAbilityList,
        },
        { id: 'create-ability', label: 'Create Ability', route: '/developer/create-ability' },
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

  // Developer-specific AccountTooltip with light theme
  const DeveloperAccountTooltip = () => {
    const { authInfo } = useReadAuthInfo();

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
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarMenuButton
            className={`h-10 px-3 rounded-lg transition-all duration-200 text-black hover:bg-gray-100`}
          >
            <User className="h-4 w-4" />
            <span className={`font-medium text-black`}>My Account</span>
          </SidebarMenuButton>
        </TooltipTrigger>

        {authInfo && (
          <TooltipContent side="top" className={`bg-white border-gray-200 text-black max-w-sm`}>
            <div className="whitespace-pre-line text-xs">
              <div className="mb-2">{formatAuthInfo()}</div>
              {authInfo.agentPKP?.ethAddress && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-600">Agent PKP:</div>
                    <div className={`font-mono text-xs text-black truncate`}>
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
    );
  };

  return (
    <SidebarComponent variant="sidebar" collapsible="offcanvas" className="border-r-0">
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
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  {item.type === 'link' ? (
                    <SidebarMenuButton
                      asChild
                      isActive={isActiveRoute(item.route)}
                      className={`h-10 px-3 rounded-lg transition-all duration-200 ${
                        isActiveRoute(item.route)
                          ? `bg-gray-100/50 text-orange-500 font-semibold`
                          : `text-black hover:bg-gray-100`
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
                            ? `bg-gray-100/50 text-orange-500 font-semibold`
                            : `text-black hover:bg-gray-100`
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
                                      ? `bg-gray-100/50 text-orange-500 font-semibold`
                                      : `text-black hover:bg-gray-100`
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
              <DeveloperAccountTooltip />
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
        </div>
      </SidebarFooter>
    </SidebarComponent>
  );
}
