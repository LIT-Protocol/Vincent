import { useEffect, useCallback, useReducer } from 'react';
import { useAccount } from 'wagmi';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useUserApps } from '@/hooks/developer-dashboard/useUserApps';
import { useUserTools } from '@/hooks/developer-dashboard/useUserTools';
import { useUserPolicies } from '@/hooks/developer-dashboard/useUserPolicies';
import { App, Tool, Policy } from '@/types/developer-dashboard/appTypes';

interface SidebarState {
  expandedMenus: Set<string>;
  selectedForm: string | null;
  selectedListView: string | null;
  selectedApp: App | null;
  selectedAppView: string | null;
  selectedTool: Tool | null;
  selectedToolView: string | null;
  selectedPolicy: Policy | null;
  selectedPolicyView: string | null;
}

type SidebarAction =
  | { type: 'RESET_ALL' }
  | { type: 'SET_LIST_VIEW'; payload: { listView: string | null; expandedMenus: Set<string> } }
  | { type: 'SET_FORM'; payload: string }
  | {
      type: 'SET_APP_STATE';
      payload: { app: App | null; view: string | null; expandedMenus: Set<string> };
    }
  | {
      type: 'SET_TOOL_STATE';
      payload: { tool: Tool | null; view: string | null; expandedMenus: Set<string> };
    }
  | {
      type: 'SET_POLICY_STATE';
      payload: { policy: Policy | null; view: string | null; expandedMenus: Set<string> };
    }
  | { type: 'TOGGLE_MENU'; payload: string };

const initialState: SidebarState = {
  expandedMenus: new Set(),
  selectedForm: null,
  selectedListView: null,
  selectedApp: null,
  selectedAppView: null,
  selectedTool: null,
  selectedToolView: null,
  selectedPolicy: null,
  selectedPolicyView: null,
};

function sidebarReducer(state: SidebarState, action: SidebarAction): SidebarState {
  switch (action.type) {
    case 'RESET_ALL':
      return initialState;

    case 'SET_LIST_VIEW':
      return {
        ...initialState,
        selectedListView: action.payload.listView,
        expandedMenus: action.payload.expandedMenus,
      };

    case 'SET_FORM': {
      // Determine which parent menu should be expanded based on form type
      const expandedMenus = new Set<string>();
      if (action.payload === 'create-app') {
        expandedMenus.add('app');
      } else if (action.payload === 'create-tool') {
        expandedMenus.add('tool');
      } else if (action.payload === 'create-policy') {
        expandedMenus.add('policy');
      }

      return {
        ...state,
        selectedForm: action.payload,
        selectedListView: null,
        selectedApp: null,
        selectedAppView: null,
        selectedTool: null,
        selectedToolView: null,
        selectedPolicy: null,
        selectedPolicyView: null,
        expandedMenus,
      };
    }

    case 'SET_APP_STATE':
      return {
        ...initialState,
        selectedApp: action.payload.app,
        selectedAppView: action.payload.view,
        expandedMenus: action.payload.expandedMenus,
      };

    case 'SET_TOOL_STATE':
      return {
        ...initialState,
        selectedTool: action.payload.tool,
        selectedToolView: action.payload.view,
        expandedMenus: action.payload.expandedMenus,
      };

    case 'SET_POLICY_STATE':
      return {
        ...initialState,
        selectedPolicy: action.payload.policy,
        selectedPolicyView: action.payload.view,
        expandedMenus: action.payload.expandedMenus,
      };

    case 'TOGGLE_MENU': {
      const newExpandedMenus = new Set(state.expandedMenus);
      if (newExpandedMenus.has(action.payload)) {
        newExpandedMenus.delete(action.payload);
      } else {
        newExpandedMenus.add(action.payload);
      }
      return {
        ...state,
        expandedMenus: newExpandedMenus,
      };
    }

    default:
      return state;
  }
}

export function useAppSidebar() {
  const { isConnected } = useAccount();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const shouldShowSidebar = isConnected && location.pathname.startsWith('/developer');

  const [state, dispatch] = useReducer(sidebarReducer, initialState);

  // Use filtered hooks instead of unified data context
  const { data: filteredApps, isLoading: appsLoading, isError: appsError } = useUserApps();
  const { data: filteredTools, isLoading: toolsLoading, isError: toolsError } = useUserTools();
  const {
    data: filteredPolicies,
    isLoading: policiesLoading,
    isError: policiesError,
  } = useUserPolicies();

  const isLoading = appsLoading || toolsLoading || policiesLoading;
  const hasErrors = appsError || toolsError || policiesError;

  const findAppById = useCallback(
    (appId: number): App | null => {
      if (!filteredApps || filteredApps.length === 0) return null;
      return filteredApps.find((app: App) => app.appId === appId) || null;
    },
    [filteredApps],
  );

  const findToolByPackageName = useCallback(
    (packageName: string): Tool | null => {
      if (!filteredTools || filteredTools.length === 0) return null;
      return filteredTools.find((tool: Tool) => tool.packageName === packageName) || null;
    },
    [filteredTools],
  );

  const findPolicyByPackageName = useCallback(
    (packageName: string): Policy | null => {
      if (!filteredPolicies || filteredPolicies.length === 0) return null;
      return filteredPolicies.find((policy: Policy) => policy.packageName === packageName) || null;
    },
    [filteredPolicies],
  );

  useEffect(() => {
    if (!shouldShowSidebar || isLoading) {
      return;
    }

    const pathname = location.pathname;

    try {
      if (pathname === '/developer/dashboard') {
        dispatch({ type: 'RESET_ALL' });
      } else if (pathname === '/developer/apps') {
        dispatch({
          type: 'SET_LIST_VIEW',
          payload: {
            listView: 'app',
            expandedMenus: new Set(['app', 'my-apps']),
          },
        });
      } else if (pathname === '/developer/tools') {
        dispatch({
          type: 'SET_LIST_VIEW',
          payload: {
            listView: 'tool',
            expandedMenus: new Set(['tool', 'my-tools']),
          },
        });
      } else if (pathname === '/developer/policies') {
        dispatch({
          type: 'SET_LIST_VIEW',
          payload: {
            listView: 'policy',
            expandedMenus: new Set(['policy', 'my-policies']),
          },
        });
      } else if (pathname === '/developer/create-app') {
        dispatch({ type: 'SET_FORM', payload: 'create-app' });
      } else if (pathname === '/developer/create-tool') {
        dispatch({ type: 'SET_FORM', payload: 'create-tool' });
      } else if (pathname === '/developer/create-policy') {
        dispatch({ type: 'SET_FORM', payload: 'create-policy' });
      } else if (pathname.startsWith('/developer/appId/') || params.appId) {
        let appIdStr: string;

        if (params.appId) {
          appIdStr = params.appId;
        } else {
          // Extract appId from pathname: /developer/appId/123
          const parts = pathname.split('/'); // ['', 'developer', 'appId', '123'] TEMP: This is a hack to get the appId from the pathname
          appIdStr = parts[3];
        }

        const appId = parseInt(appIdStr, 10);

        // Validate appId is a valid number
        if (isNaN(appId)) {
          console.error(`Invalid appId parameter: ${appIdStr}`);
          return;
        }

        const app = findAppById(appId);
        if (!app) {
          console.warn(`App with ID ${appId} not found`);
          return;
        }

        // Expand the full navigation hierarchy
        const menusToExpand = new Set(['app', 'my-apps']);
        let appView = 'app-details';

        if (params.versionId || pathname.includes('/version/')) {
          // On a specific version page - expand all the way down
          const versionNumber = params.versionId || pathname.split('/version/')[1]; // TEMP: This is a hack to get the version number from the pathname
          appView = `version-${versionNumber}`;
          menusToExpand.add('app-versions');
        } else if (pathname.includes('/versions')) {
          // On the versions list page
          appView = 'app-versions';
          menusToExpand.add('app-versions');
        }

        dispatch({
          type: 'SET_APP_STATE',
          payload: {
            app,
            view: appView,
            expandedMenus: menusToExpand,
          },
        });
      } else if (pathname.startsWith('/developer/toolId/') || params.packageName) {
        // Handle tool-specific routes using params OR pathname parsing
        let packageName: string;

        if (params.packageName) {
          try {
            packageName = decodeURIComponent(params.packageName);
          } catch (error) {
            console.error(`Invalid packageName parameter: ${params.packageName}`, error);
            return;
          }
        } else {
          // Extract packageName from pathname: /developer/toolId/package-name
          const parts = pathname.split('/'); // ['', 'developer', 'toolId', 'package-name'] TEMP: This is a hack to get the package name from the pathname
          try {
            packageName = decodeURIComponent(parts[3]);
          } catch (error) {
            console.error(`Invalid packageName in pathname: ${pathname}`, error);
            return;
          }
        }

        const tool = findToolByPackageName(packageName);
        if (!tool) {
          console.warn(`Tool with package name ${packageName} not found`);
          return;
        }

        // Expand the full navigation hierarchy
        const menusToExpand = new Set(['tool', 'my-tools']);
        let toolView = 'tool-details';

        if (params.version || pathname.includes('/version/')) {
          // On a specific version page - expand all the way down
          const versionNumber = params.version || pathname.split('/version/')[1];
          toolView = `version-${versionNumber}`;
          menusToExpand.add('tool-versions');
        } else if (pathname.includes('/versions')) {
          // On the versions list page
          toolView = 'tool-versions';
          menusToExpand.add('tool-versions');
        }

        dispatch({
          type: 'SET_TOOL_STATE',
          payload: {
            tool,
            view: toolView,
            expandedMenus: menusToExpand,
          },
        });
      } else if (pathname.startsWith('/developer/policyId/') || params.policyId) {
        // Handle policy-specific routes using params OR pathname parsing
        let packageName: string;

        if (params.policyId) {
          try {
            packageName = decodeURIComponent(params.policyId);
          } catch (error) {
            console.error(`Invalid policyId parameter: ${params.policyId}`, error);
            return;
          }
        } else {
          // Extract packageName from pathname: /developer/policyId/package-name
          const parts = pathname.split('/'); // ['', 'developer', 'policyId', 'package-name'] TEMP: This is a hack to get the package name from the pathname
          try {
            packageName = decodeURIComponent(parts[3]);
          } catch (error) {
            console.error(`Invalid packageName in pathname: ${pathname}`, error);
            return;
          }
        }

        const policy = findPolicyByPackageName(packageName);
        if (!policy) {
          console.warn(`Policy with package name ${packageName} not found`);
          return;
        }

        // Expand the full navigation hierarchy
        const menusToExpand = new Set(['policy', 'my-policies']);
        let policyView = 'policy-details';

        if (params.version || pathname.includes('/version/')) {
          // On a specific version page - expand all the way down
          const versionNumber = params.version || pathname.split('/version/')[1];
          policyView = `version-${versionNumber}`;
          menusToExpand.add('policy-versions');
        } else if (pathname.includes('/versions')) {
          // On the versions list page
          policyView = 'policy-versions';
          menusToExpand.add('policy-versions');
        }

        dispatch({
          type: 'SET_POLICY_STATE',
          payload: {
            policy,
            view: policyView,
            expandedMenus: menusToExpand,
          },
        });
      }
    } catch (error) {
      console.error('Error processing route in useAppSidebar:', error);
    }
  }, [
    location.pathname,
    params.appId,
    params.versionId,
    params.packageName,
    params.version,
    params.policyId,
    filteredApps,
    filteredTools,
    filteredPolicies,
    shouldShowSidebar,
    isLoading,
    findAppById,
    findToolByPackageName,
    findPolicyByPackageName,
  ]);

  // Handle menu toggle
  const handleToggleMenu = useCallback((menuId: string) => {
    dispatch({ type: 'TOGGLE_MENU', payload: menuId });
  }, []);

  // Handle navigation
  const handleCategoryClick = useCallback(
    (categoryId: string) => {
      // Always toggle the menu when clicking a category
      dispatch({ type: 'TOGGLE_MENU', payload: categoryId });

      // Also navigate to the list view
      if (categoryId === 'app') {
        navigate('/developer/apps');
      } else if (categoryId === 'tool') {
        navigate('/developer/tools');
      } else if (categoryId === 'policy') {
        navigate('/developer/policies');
      }
    },
    [navigate],
  );

  const handleMenuSelection = useCallback(
    (id: string) => {
      if (id === 'dashboard') {
        navigate('/developer/dashboard');
      } else if (id === 'my-apps') {
        navigate('/developer/apps');
      } else if (id === 'my-tools') {
        navigate('/developer/tools');
      } else if (id === 'my-policies') {
        navigate('/developer/policies');
      } else if (id === 'create-app') {
        navigate('/developer/create-app');
      } else if (id === 'create-tool') {
        navigate('/developer/create-tool');
      } else if (id === 'create-policy') {
        navigate('/developer/create-policy');
      }
    },
    [navigate],
  );

  const handleAppSelection = useCallback(
    (app: App | null) => {
      if (app) {
        navigate(`/developer/appId/${app.appId}`);
      } else {
        navigate('/developer/apps');
      }
    },
    [navigate],
  );

  const handleAppViewSelection = useCallback(
    (viewId: string) => {
      if (state.selectedApp) {
        if (viewId === 'app-details') {
          navigate(`/developer/appId/${state.selectedApp.appId}`);
        } else if (viewId === 'app-versions') {
          navigate(`/developer/appId/${state.selectedApp.appId}/versions`);
        } else if (viewId.startsWith('version-')) {
          const versionNumber = viewId.replace('version-', '');
          navigate(`/developer/appId/${state.selectedApp.appId}/version/${versionNumber}`);
        }
      }
    },
    [navigate, state.selectedApp],
  );

  // Add tool selection and navigation handlers
  const handleToolSelection = useCallback(
    (tool: Tool | null) => {
      if (tool) {
        navigate(`/developer/toolId/${encodeURIComponent(tool.packageName)}`);
      } else {
        navigate('/developer/tools');
      }
    },
    [navigate],
  );

  const handleToolViewSelection = useCallback(
    (viewId: string) => {
      if (state.selectedTool) {
        if (viewId === 'tool-details') {
          navigate(`/developer/toolId/${encodeURIComponent(state.selectedTool.packageName)}`);
        } else if (viewId === 'tool-versions') {
          navigate(
            `/developer/toolId/${encodeURIComponent(state.selectedTool.packageName)}/versions`,
          );
        } else if (viewId.startsWith('version-')) {
          const versionNumber = viewId.replace('version-', '');
          navigate(
            `/developer/toolId/${encodeURIComponent(state.selectedTool.packageName)}/version/${versionNumber}`,
          );
        }
      }
    },
    [navigate, state.selectedTool],
  );

  // Add policy selection and navigation handlers
  const handlePolicySelection = useCallback(
    (policy: Policy | null) => {
      if (policy) {
        navigate(`/developer/policyId/${encodeURIComponent(policy.packageName)}`);
      } else {
        navigate('/developer/policies');
      }
    },
    [navigate],
  );

  const handlePolicyViewSelection = useCallback(
    (viewId: string) => {
      if (state.selectedPolicy) {
        if (viewId === 'policy-details') {
          navigate(`/developer/policyId/${encodeURIComponent(state.selectedPolicy.packageName)}`);
        } else if (viewId === 'policy-versions') {
          navigate(
            `/developer/policyId/${encodeURIComponent(state.selectedPolicy.packageName)}/versions`,
          );
        } else if (viewId.startsWith('version-')) {
          const versionNumber = viewId.replace('version-', '');
          navigate(
            `/developer/policyId/${encodeURIComponent(state.selectedPolicy.packageName)}/version/${versionNumber}`,
          );
        }
      }
    },
    [navigate, state.selectedPolicy],
  );

  return {
    // State
    shouldShowSidebar,
    expandedMenus: state.expandedMenus,
    selectedForm: state.selectedForm,
    selectedListView: state.selectedListView,
    selectedApp: state.selectedApp,
    selectedAppView: state.selectedAppView,
    selectedTool: state.selectedTool,
    selectedToolView: state.selectedToolView,
    selectedPolicy: state.selectedPolicy,
    selectedPolicyView: state.selectedPolicyView,

    // Data from filtered hooks
    apps: filteredApps,
    tools: filteredTools,
    policies: filteredPolicies,
    isLoading,
    hasErrors,

    // Handlers
    onToggleMenu: handleToggleMenu,
    onCategoryClick: handleCategoryClick,
    onMenuSelection: handleMenuSelection,
    onAppSelection: handleAppSelection,
    onAppViewSelection: handleAppViewSelection,
    onToolSelection: handleToolSelection,
    onToolViewSelection: handleToolViewSelection,
    onPolicySelection: handlePolicySelection,
    onPolicyViewSelection: handlePolicyViewSelection,
  };
}
