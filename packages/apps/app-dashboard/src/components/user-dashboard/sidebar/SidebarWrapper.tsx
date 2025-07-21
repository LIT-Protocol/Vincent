import { AppSidebar } from './AppSidebar';
import { SidebarSkeleton } from './SidebarSkeleton';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { useSidebarData } from '@/hooks/user-dashboard/sidebar/useSidebarData';
import { SidebarError } from './SidebarError';

export function SidebarWrapper() {
  const { authInfo, isProcessing, error } = useReadAuthInfo();
  const pkpEthAddress = authInfo?.agentPKP?.ethAddress || '';

  // Early return if required params are missing
  if (!pkpEthAddress && !isProcessing) {
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

  // Now we have stable pkpTokenId, so we can call the consolidated hook
  return <SidebarWithData pkpEthAddress={pkpEthAddress} />;
}

function SidebarWithData({ pkpEthAddress }: { pkpEthAddress: string }) {
  const { apps, permittedAppVersions, appVersionsMap, isLoading, error } = useSidebarData({
    pkpEthAddress,
  });

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
