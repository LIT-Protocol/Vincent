import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ArrowRight, RefreshCw } from 'lucide-react';
import { IRelayPKP } from '@lit-protocol/types';

import { ActionCard } from './ui/ActionCard';
import { ConnectAppHeader } from './ui/ConnectAppHeader';
import { ConnectPageHeader } from './ui/ConnectPageHeader';
import { InfoBanner } from './ui/InfoBanner';
import { theme } from './ui/theme';
import { useCanGoBack } from '@/hooks/user-dashboard/connect/useCanGoBack';
import { useJwtRedirect } from '@/hooks/user-dashboard/connect/useJwtRedirect';
import { ReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { App, AppVersion } from '@/types/developer-dashboard/appTypes';
import { wait } from '@/lib/utils';

type ReturningUserConnectProps = {
  appData: App;
  version: number;
  versionData: AppVersion;
  activeVersionData?: AppVersion;
  readAuthInfo: ReadAuthInfo;
  agentPKP: IRelayPKP;
  hasConfigurablePolicies: boolean;
  onEditPermissions: () => void;
  onUpdateVersion: () => void;
};

export function ReturningUserConnect({
  appData,
  version,
  versionData,
  activeVersionData,
  readAuthInfo,
  agentPKP,
  hasConfigurablePolicies,
  onEditPermissions,
  onUpdateVersion,
}: ReturningUserConnectProps) {
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const [isContinueLoading, setIsContinueLoading] = useState(false);
  const { generateJWT, executeRedirect, isLoading, loadingStatus, error, redirectUrl } =
    useJwtRedirect({ readAuthInfo, agentPKP });

  // Handle redirect when JWT is ready
  useEffect(() => {
    if (redirectUrl && !localSuccess) {
      (async () => {
        setLocalSuccess('Success! Redirecting to app...');
        await wait(1000);
        executeRedirect();
      })();
    }
  }, [redirectUrl, localSuccess, executeRedirect]);

  const handleEditParameters = () => {
    onEditPermissions();
  };

  const handleUpdateVersion = () => {
    onUpdateVersion();
  };

  const handleContinue = async () => {
    setIsContinueLoading(true);
    await generateJWT(appData, version);
    // Keep loading until redirect happens
  };

  return (
    <div
      className={`w-full max-w-md mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden relative z-10 origin-center`}
    >
      {/* Header */}
      <ConnectPageHeader authInfo={readAuthInfo.authInfo!} />

      {/* Main Content */}
      <div className="px-3 sm:px-4 py-6 sm:py-8 space-y-6">
        {/* App Header */}
        {appData && <ConnectAppHeader app={appData} />}

        {/* Dividing line */}
        <div className={`border-b ${theme.cardBorder}`}></div>

        {/* Status Banner - Show appropriate status based on version state */}
        {versionData && !versionData.enabled && activeVersionData && !activeVersionData.enabled ? (
          <InfoBanner
            type="warning"
            title="App Unavailable"
            message={`Both your permitted version (${version}) and the app's active version (${appData.activeVersion}) have been disabled by the app developer.${appData.contactEmail ? ` Contact them at ${appData.contactEmail}` : ''}`}
          />
        ) : versionData && !versionData.enabled ? (
          <InfoBanner
            type="warning"
            title="Version Disabled"
            message={`Your permitted version (${version}) has been disabled by the app developer. You must update your permissions to continue using this app.`}
          />
        ) : version !== appData.activeVersion ? (
          <InfoBanner
            title="Version Update Available"
            message={`You're using version ${version}, but the app has updated to version ${appData.activeVersion}. Update your permissions to access the latest features.`}
          />
        ) : (
          <InfoBanner
            type="orange"
            title="App Already Permitted"
            message="You've previously granted permissions to this app."
          />
        )}

        {/* Options */}
        <div className="space-y-3">
          <div className="space-y-2">
            {/* Show different primary action based on version status */}
            {versionData &&
            !versionData.enabled &&
            activeVersionData &&
            !activeVersionData.enabled ? (
              /* Both versions disabled - Show contact options and back button */
              <>
                {appData.appUserUrl && (
                  <ActionCard
                    icon={
                      <svg
                        className="w-4 h-4 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    }
                    iconBg="bg-green-500/20"
                    title="Visit App Website"
                    description=""
                    onClick={() => window.open(appData.appUserUrl, '_blank')}
                  />
                )}
                <ActionCard
                  icon={
                    <svg
                      className="w-4 h-4 text-orange-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  }
                  iconBg="bg-orange-500/20"
                  title="Unpermit App"
                  description=""
                  onClick={() => navigate(`/user/appId/${appData.appId}`)}
                />
                <ActionCard
                  icon={<ArrowRight className="w-4 h-4 text-gray-500 rotate-180" />}
                  iconBg="bg-gray-500/20"
                  title="Go Back"
                  description=""
                  onClick={() => navigate(-1)}
                  disabled={!canGoBack}
                />
              </>
            ) : versionData && !versionData.enabled ? (
              /* Update Version Option - Primary action when version is disabled */
              <>
                <ActionCard
                  icon={<RefreshCw className="w-4 h-4 text-orange-500" />}
                  iconBg="bg-orange-500/20"
                  title="Update to Active Version"
                  description="Required to continue using this app"
                  onClick={handleUpdateVersion}
                />
                <ActionCard
                  icon={<Settings className="w-4 h-4 text-gray-500" />}
                  iconBg="bg-gray-500/20"
                  title="Manage App"
                  description="View settings or unpermit this app"
                  onClick={handleEditParameters}
                />
              </>
            ) : (
              <>
                {/* Show Update Version button when version update is available */}
                {version !== appData.activeVersion && (
                  <ActionCard
                    icon={<RefreshCw className="w-4 h-4" style={{ color: theme.brandOrange }} />}
                    iconBg="bg-orange-500/20"
                    title="Update to Latest Version"
                    description="Recommended for the latest features and improvements"
                    onClick={handleUpdateVersion}
                  />
                )}
                {/* Edit Parameters Option - Show when there are configurable policies */}
                {hasConfigurablePolicies ? (
                  <ActionCard
                    icon={<Settings className="w-4 h-4" style={{ color: theme.brandOrange }} />}
                    iconBg="bg-orange-500/20"
                    title="Edit Permissions"
                    description="Review or modify app permissions and settings"
                    onClick={handleEditParameters}
                  />
                ) : (
                  /* Manage App Option - Show when no configurable policies */
                  <ActionCard
                    icon={<Settings className="w-4 h-4" style={{ color: theme.brandOrange }} />}
                    iconBg="bg-orange-500/20"
                    title="Manage App"
                    description="View app details or unpermit this app"
                    onClick={() => navigate(`/user/appId/${appData.appId}`)}
                  />
                )}
              </>
            )}

            {/* Continue Option - Only show if version is enabled and not both versions disabled */}
            {!(versionData && !versionData.enabled) && (
              <ActionCard
                icon={<ArrowRight className="w-4 h-4" style={{ color: theme.brandOrange }} />}
                iconBg="bg-orange-500/20"
                title={`Continue to ${appData.name}`}
                description="Proceed with your current permissions"
                onClick={handleContinue}
                isLoading={isContinueLoading || isLoading || !!localSuccess}
                loadingStatus={localSuccess || loadingStatus}
                error={error}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
