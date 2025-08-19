import { ArrowLeft, RefreshCw } from 'lucide-react';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { ConnectAppHeader } from '@/components/user-dashboard/connect/ui/ConnectAppHeader';
import { InfoBanner } from '@/components/user-dashboard/connect/ui/InfoBanner';
import { ActionCard } from '@/components/user-dashboard/connect/ui/ActionCard';
import { useNavigate } from 'react-router-dom';
import { ReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { App } from '@/types/developer-dashboard/appTypes';
import { useCanGoBack } from '@/hooks/user-dashboard/connect/useCanGoBack';

type AppVersionNotInRegistryUpdateProps = {
  appData: App;
  readAuthInfo: ReadAuthInfo;
};

export function AppVersionNotInRegistryUpdate({ appData }: AppVersionNotInRegistryUpdateProps) {
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRetry = () => {
    // Force a page refresh to re-check the registry
    window.location.reload();
  };

  return (
    <div
      className={`w-full max-w-md mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden relative z-10 origin-center`}
    >
      {/* Main Content */}
      <div className="px-3 sm:px-4 py-6 sm:py-8 space-y-6">
        {/* App Header */}
        {appData && <ConnectAppHeader app={appData} />}

        {/* Status Banner */}
        <InfoBanner
          type="warning"
          title="App Version Not Published"
          message={`The app's active version (${appData.activeVersion}) is not yet published in the on-chain registry. The app developer needs to publish this version before you can grant permissions.`}
        />

        {/* Action Options */}
        <div className="space-y-3">
          <ActionCard
            icon={<ArrowLeft className="w-4 h-4 text-blue-500" />}
            iconBg="bg-blue-500/20"
            title="Go Back"
            description=""
            onClick={handleGoBack}
            disabled={!canGoBack}
          />
          <ActionCard
            icon={<RefreshCw className="w-4 h-4 text-green-500" />}
            iconBg="bg-green-500/20"
            title="Check Again"
            description=""
            onClick={handleRetry}
          />
        </div>
      </div>
    </div>
  );
}
