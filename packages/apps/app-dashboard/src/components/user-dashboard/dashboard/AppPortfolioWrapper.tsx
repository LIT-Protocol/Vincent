import { useParams } from 'react-router-dom';
import { AppPortfolioPage } from './AppPortfolioPage';
import { useAgentPKPForApp } from '@/hooks/user-dashboard/useAgentPKPForApp';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { useConnectInfo } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { theme } from '@/components/user-dashboard/connect/ui/theme';

export function AppPortfolioWrapper() {
  const { appId } = useParams<{ appId: string }>();
  const { authInfo } = useReadAuthInfo();
  const { data: connectData, isLoading: connectLoading, isError: connectError } = useConnectInfo(appId || '');
  
  const userAddress = authInfo?.userPKP?.ethAddress || '';
  
  // Get agent PKP for this specific app (same way as UserPermissionWrapper)
  const {
    agentPKP,
    loading: agentLoading,
    error: agentError,
  } = useAgentPKPForApp(userAddress, appId ? Number(appId) : undefined);

  const isLoading = connectLoading || agentLoading;
  const error = connectError || agentError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`text-sm ${theme.textMuted}`}>Loading agent data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center max-w-md mx-auto px-6">
          <h3 className={`text-xl font-semibold mb-2 ${theme.text}`}>Unable to load agent data</h3>
          <p className={`text-sm ${theme.textMuted} leading-relaxed`}>
            {error instanceof Error ? error.message : 'An unexpected error occurred while loading the agent data.'}
          </p>
        </div>
      </div>
    );
  }

  if (!agentPKP?.ethAddress) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center max-w-md mx-auto px-6">
          <h3 className={`text-xl font-semibold mb-2 ${theme.text}`}>No agent found</h3>
          <p className={`text-sm ${theme.textMuted} leading-relaxed`}>
            No agent PKP found for this application. Please ensure you have the proper permissions.
          </p>
        </div>
      </div>
    );
  }

  return <AppPortfolioPage agentAddress={agentPKP.ethAddress} appName={connectData?.app?.name || appId || ''} />;
}