import { useEffect, useState, useMemo } from 'react';
import { useErrorPopup } from '@/providers/ErrorPopup';
import { useAccount } from 'wagmi';
import { useLocation, useNavigate } from 'react-router';
import { vincentApiClient } from '@/components/app-dashboard/mock-forms/vincentApiClient';
import { DashboardContent } from '@/components/app-dashboard/DashboardContent';
import { AppsList, ToolsList, PoliciesList } from './ResourceLists';
import { CreateAppForm } from '@/components/app-dashboard/mock-forms/generic/AppForms';
import { CreateToolForm } from '@/components/app-dashboard/mock-forms/generic/ToolForms';
import { CreatePolicyForm } from '@/components/app-dashboard/mock-forms/generic/PolicyForms';

export default function DashboardScreen({ vincentApp }: { vincentApp: any[] }) {
  const [dashboard, setDashboard] = useState<any[]>([]);
  const [isRefetching, setIsRefetching] = useState(false);
  const [sortOption, setSortOption] = useState<string>('all');
  const { showError } = useErrorPopup();
  const { address } = useAccount();
  const location = useLocation();
  const navigate = useNavigate();

  // API data fetching
  const {
    data: apiApps,
    error: apiError,
    isLoading: isApiLoading,
  } = vincentApiClient.useListAppsQuery();

  const [getAllTools, { data: allTools, error: toolsError, isLoading: toolsLoading }] =
    vincentApiClient.useLazyListAllToolsQuery();
  const [getAllPolicies, { data: allPolicies, error: policiesError, isLoading: policiesLoading }] =
    vincentApiClient.useLazyListAllPoliciesQuery();

  // Automatically fetch tools and policies when component loads
  useEffect(() => {
    getAllTools();
    getAllPolicies();
  }, [getAllTools, getAllPolicies]);

  // Filter data based on user address
  const filteredApps = useMemo(() => {
    if (!address || !apiApps || apiApps.length === 0) return [];
    return apiApps.filter(
      (apiApp: any) => apiApp.managerAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [apiApps, address]);

  const filteredTools = useMemo(() => {
    if (!address || toolsError || !allTools || allTools.length === 0) return [];
    return allTools.filter(
      (tool: any) => tool.authorWalletAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [allTools, address, toolsError]);

  const filteredPolicies = useMemo(() => {
    if (!address || policiesError || !allPolicies || allPolicies.length === 0) return [];
    return allPolicies.filter(
      (policy: any) => policy.authorWalletAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [allPolicies, address, policiesError]);

  const getFilteredAppsForDashboard = () => {
    if (sortOption === 'all') {
      return filteredApps;
    }
    return filteredApps.filter((app) => app.deploymentStatus === sortOption);
  };

  useEffect(() => {
    if (vincentApp) {
      try {
        setDashboard(vincentApp);
      } catch (error) {
        console.error('Dashboard Error:', error);
        showError(
          error instanceof Error ? error.message : 'Error loading dashboard',
          'Dashboard Error',
        );
      } finally {
        setIsRefetching(false);
      }
    }
  }, [vincentApp, showError]);

  // Determine what to render based on current path
  const renderContent = () => {
    const pathname = location.pathname;

    if (pathname === '/apps') {
      return (
        <AppsList
          apps={getFilteredAppsForDashboard()}
          isLoading={isApiLoading}
          error={apiError}
          sortOption={sortOption}
          onSortChange={setSortOption}
          onCreateClick={() => navigate('/create-app')}
          onAppClick={(app: any) => {
            // Navigate to app details page
            navigate(`/appId/${app.appId}`);
          }}
        />
      );
    }

    if (pathname === '/tools') {
      return (
        <ToolsList
          tools={filteredTools}
          isLoading={toolsLoading}
          error={toolsError}
          onCreateClick={() => navigate('/create-tool')}
        />
      );
    }

    if (pathname === '/policies') {
      return (
        <PoliciesList
          policies={filteredPolicies}
          isLoading={policiesLoading}
          error={policiesError}
          onCreateClick={() => navigate('/create-policy')}
        />
      );
    }

    if (pathname === '/create-app') {
      return <CreateAppForm />;
    }

    if (pathname === '/create-tool') {
      return <CreateToolForm />;
    }

    if (pathname === '/create-policy') {
      return <CreatePolicyForm />;
    }

    // Default dashboard view
    return (
      <DashboardContent
        filteredAppsCount={filteredApps.length}
        filteredToolsCount={filteredTools.length}
        filteredPoliciesCount={filteredPolicies.length}
        onMenuSelection={(id: string) => {
          switch (id) {
            case 'create-app':
              navigate('/create-app');
              break;
            case 'create-tool':
              navigate('/create-tool');
              break;
            case 'create-policy':
              navigate('/create-policy');
              break;
            case 'app':
              navigate('/apps');
              break;
            case 'tool':
              navigate('/tools');
              break;
            case 'policy':
              navigate('/policies');
              break;
            default:
              console.warn('Unknown menu selection:', id);
          }
        }}
      />
    );
  };

  if (!dashboard || isRefetching) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-sm text-gray-600">{isRefetching ? 'Refreshing...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return <div className="p-6">{renderContent()}</div>;
}
