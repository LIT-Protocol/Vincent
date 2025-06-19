import { useNavigate } from 'react-router';
import { DashboardContent } from '@/components/app-dashboard/DashboardContent';
import { useDashboard } from '../../components/app-dashboard/DashboardContext';
import { PageLoader } from '../../components/app-dashboard/PageLoader';
import ConnectWalletScreen from './home';
import { useWalletProtection } from '@/hooks/app-dashboard/useWalletProtection';

export default function DashboardHome() {
  const navigate = useNavigate();
  const { apps, tools, policies, loading, errors } = useDashboard();
  const { isConnected } = useWalletProtection();

  // If not connected, show the connect wallet screen
  if (!isConnected) {
    return <ConnectWalletScreen />;
  }

  const hasError = Object.values(errors).some((error) => error !== null);
  const isLoading = Object.values(loading).some((loading) => loading);

  const handleMenuSelection = (id: string) => {
    const routes = {
      'create-app': '/developer/create-app',
      'create-tool': '/developer/create-tool',
      'create-policy': '/developer/create-policy',
      app: '/developer/apps',
      tool: '/developer/tools',
      policy: '/developer/policies',
    };

    const route = routes[id as keyof typeof routes];
    if (route) {
      navigate(route);
    } else {
      console.warn('Unknown menu selection:', id);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <DashboardContent
      filteredAppsCount={apps.length}
      filteredToolsCount={tools.length}
      filteredPoliciesCount={policies.length}
      error={hasError ? 'Some data failed to load' : null}
      onMenuSelection={handleMenuSelection}
    />
  );
}
