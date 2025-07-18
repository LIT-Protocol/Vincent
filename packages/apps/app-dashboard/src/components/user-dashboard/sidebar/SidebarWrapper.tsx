import { AppSidebar } from './AppSidebar';
import { SidebarSkeleton } from './SidebarSkeleton';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { useSidebarData } from '@/hooks/user-dashboard/sidebar/useSidebarData';

export function SidebarWrapper() {
  const { authInfo, isProcessing, error } = useReadAuthInfo();
  const pkpTokenId = authInfo?.agentPKP?.tokenId || '';

  // Early return if required params are missing
  if (!pkpTokenId && !isProcessing) {
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
  return <SidebarWithData pkpTokenId={pkpTokenId} />;
}


function SidebarWithData({ pkpTokenId }: { pkpTokenId: string }) {
  const {
    apps,
    permittedAppVersions,
    appVersionsMap,
    isLoading,
    error,
  } = useSidebarData({ pkpTokenId });

  // Show skeleton while data is loading
  if (isLoading) {
    return <SidebarSkeleton />;
  }

  // Handle errors
  if (error) {
    return (
      <StatusMessage
        message={`Failed to load sidebar data: ${error}`}
        type="error"
      />
    );
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
