import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { ConnectPageHeader } from './ui/ConnectPageHeader';
import { ConnectAppHeader } from './ui/ConnectAppHeader';
import { ActionButtons } from './ui/ActionButtons';
import { ConnectFooter } from '../ui/Footer';
import { theme } from './ui/theme';
import { InfoBanner } from './ui/InfoBanner';
import { App } from '@/types/developer-dashboard/appTypes';

interface AppUnavailableConnectProps {
  appData: App;
  readAuthInfo: ReadAuthInfo;
  activeVersion?: number;
}

export function AppUnavailableConnect({
  appData,
  readAuthInfo,
  activeVersion,
}: AppUnavailableConnectProps) {
  const navigate = useNavigate();

  const handleVisitApp = useCallback(() => {
    if (appData.appUserUrl) {
      window.open(appData.appUserUrl, '_blank');
    }
  }, [appData.appUserUrl]);

  const handleManagePermissions = useCallback(() => {
    navigate(`/user/appId/${appData.appId}`);
  }, [navigate, appData.appId]);

  return (
    <div
      className={`max-w-md mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden relative z-10 origin-center`}
    >
      {/* Header */}
      <ConnectPageHeader authInfo={readAuthInfo.authInfo!} />

      <div className="px-3 sm:px-4 py-6 sm:py-8 space-y-6">
        {/* App Header */}
        <ConnectAppHeader app={appData} />

        {/* Dividing line */}
        <div className={`border-b ${theme.cardBorder}`}></div>

        {/* App Unavailable Information */}
        <div className="space-y-4">
          <InfoBanner
            type="red"
            title="App Unavailable"
            message={`Both your previously permitted version and the app's active version${activeVersion ? ` (${activeVersion})` : ''} have been disabled by the app developer.${appData.contactEmail ? ` Contact them at ${appData.contactEmail}` : ''}`}
          />
        </div>

        {/* Action Buttons */}
        <ActionButtons
          onDecline={handleVisitApp}
          onSubmit={handleManagePermissions}
          isLoading={false}
          error={null}
          appName={appData.name}
          submitText="Manage Permissions"
          declineText="Visit App"
        />
      </div>

      {/* Footer */}
      <ConnectFooter />
    </div>
  );
}
