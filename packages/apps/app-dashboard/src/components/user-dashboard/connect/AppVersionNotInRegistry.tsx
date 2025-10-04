import { ArrowLeft, RefreshCw } from 'lucide-react';
import { theme } from './ui/theme';
import { ConnectAppHeader } from './ui/ConnectAppHeader';
import { ConnectPageHeader } from './ui/ConnectPageHeader';
import { ActionCard } from './ui/ActionCard';
import { InfoBanner } from './ui/InfoBanner';
import { useNavigate } from 'react-router-dom';
import { ReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { App } from '@/types/developer-dashboard/appTypes';
import { useCanGoBack } from '@/hooks/user-dashboard/connect/useCanGoBack';

type AppVersionNotInRegistryConnectProps = {
  appData: App;
  readAuthInfo: ReadAuthInfo;
  hasActiveVersion?: boolean;
};

export function AppVersionNotInRegistryConnect({
  appData,
  readAuthInfo,
  hasActiveVersion = false,
}: AppVersionNotInRegistryConnectProps) {
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
      className={`max-w-md mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden relative z-10 origin-center`}
    >
      {/* Header */}
      {readAuthInfo.authInfo && <ConnectPageHeader authInfo={readAuthInfo.authInfo} />}

      <div className="px-3 sm:px-4 py-6 sm:py-8 space-y-6">
        {/* App Header */}
        <ConnectAppHeader app={appData} />

        {/* Dividing line */}
        <div className={`border-b ${theme.cardBorder}`}></div>

        {/* Version Publication Warning */}
        <InfoBanner
          type="warning"
          title={hasActiveVersion ? 'Version Not Published' : 'App Not Yet Published'}
          message={
            hasActiveVersion
              ? `The app developer must publish version ${appData.activeVersion} on-chain before permissions can be granted. Please contact the app developer or try again later.`
              : 'The app developer must publish App version 1 on-chain before permissions can be granted. Please contact the app developer or try again later.'
          }
        />

        {/* Options */}
        <div className="space-y-3">
          <div className="space-y-2">
            {/* Go Back Option */}
            <ActionCard
              icon={<ArrowLeft className="w-4 h-4 text-gray-500" />}
              iconBg="bg-gray-500/20"
              title="Go Back"
              description=""
              onClick={handleGoBack}
              disabled={!canGoBack}
            />

            {/* Retry Option */}
            <ActionCard
              icon={<RefreshCw className="w-4 h-4 text-orange-500" />}
              iconBg="bg-orange-500/20"
              title="Check Again"
              description=""
              onClick={handleRetry}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
