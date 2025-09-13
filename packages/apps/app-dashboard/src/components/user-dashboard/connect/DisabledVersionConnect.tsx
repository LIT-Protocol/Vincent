import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { ConnectPageHeader } from './ui/ConnectPageHeader';
import { ConnectAppHeader } from './ui/ConnectAppHeader';
import { ActionButtons } from './ui/ActionButtons';
import { ConnectFooter } from '../ui/Footer';
import { theme } from './ui/theme';
import { InfoBanner } from './ui/InfoBanner';
import { App } from '@/types/developer-dashboard/appTypes';
import { ConnectPage } from './ConnectPage';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';

interface DisabledVersionConnectProps {
  appData: App;
  readAuthInfo: ReadAuthInfo;
  connectInfoMap: ConnectInfoMap;
}

export function DisabledVersionConnect({
  appData,
  readAuthInfo,
  connectInfoMap,
}: DisabledVersionConnectProps) {
  const navigate = useNavigate();
  const [showConnectPage, setShowConnectPage] = useState(false);

  const handleUpdateToLatest = useCallback(() => {
    setShowConnectPage(true);
  }, []);

  const handleDecline = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // If user has clicked to update, show the ConnectPage
  if (showConnectPage) {
    return <ConnectPage connectInfoMap={connectInfoMap} readAuthInfo={readAuthInfo} />;
  }

  // Show the disabled version message
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

        {/* Version Update Information */}
        <div className="space-y-4">
          <InfoBanner
            type="orange"
            title="Version Update Required"
            message="Your previously permitted version has been disabled. Please update to the latest version to continue using this app."
          />
        </div>

        {/* Action Buttons */}
        <ActionButtons
          onDecline={handleDecline}
          onSubmit={handleUpdateToLatest}
          isLoading={false}
          error={null}
          appName={appData.name}
          submitText="Update to Latest Version"
        />
      </div>

      {/* Footer */}
      <ConnectFooter />
    </div>
  );
}
