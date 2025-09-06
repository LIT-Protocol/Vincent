import { AppSidebar } from './AppSidebar';
import { SidebarSkeleton } from './SidebarSkeleton';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { useSidebarData } from '@/hooks/user-dashboard/sidebar/useSidebarData';
import { useAllAgentApps } from '@/hooks/user-dashboard/useAllAgentApps';
import { SidebarError } from './SidebarError';

export function SidebarWrapper() {
  const { authInfo, isProcessing, error } = useReadAuthInfo();
  const userAddress = authInfo?.userPKP?.ethAddress || '';

  // Early return if required params are missing
  if (!userAddress && !isProcessing) {
    return <SidebarSkeleton />;
  }

  // Show skeleton while auth is processing
  if (isProcessing) {
    return <SidebarSkeleton />;
  }

  // Handle auth errors
  if (error) {
    return <StatusMessage message="Authentication failed" type="error" />;
  }

  // Now we have stable userAddress, so we can call the consolidated hook
  return <SidebarWithData userAddress={userAddress} />;
}

function SidebarWithData({ userAddress }: { userAddress: string }) {
  // Get agent app permissions first
  const {
    permittedPKPs: agentAppPermissions,
    loading: permissionsLoading,
    error: permissionsError,
  } = useAllAgentApps(userAddress);

  // Get app details and versions based on those permissions
  const {
    apps,
    permittedAppVersions,
    appVersionsMap,
    isLoading: appsLoading,
    error: appsError,
  } = useSidebarData({
    agentAppPermissions,
  });

  const isLoading = permissionsLoading || appsLoading;
  const error = permissionsError?.message || appsError;

  // Show skeleton while data is loading
  if (isLoading) {
    return <SidebarSkeleton />;
  }

  // Handle errors
  if (error) {
    return <SidebarError error={error || 'An error has occurred'} />;
  }

  return (
    <AppSidebar
      apps={apps}
      permittedAppVersions={permittedAppVersions}
      appVersionsMap={appVersionsMap}
      isLoadingApps={isLoading}
    />
  );
}
