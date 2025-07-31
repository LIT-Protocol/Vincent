import { Card, CardContent } from '@/components/shared/ui/card';
import { useJwtRedirect } from '@/hooks/user-dashboard/connect/useJwtRedirect';
import { Settings, ArrowRight } from 'lucide-react';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { ConnectAppHeader } from './ui/ConnectAppHeader';
import { ConnectPageHeader } from './ui/ConnectPageHeader';
import { InfoBanner } from './ui/InfoBanner';
import { ActionCard } from './ui/ActionCard';
import { useNavigate } from 'react-router-dom';
import { UseReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { App } from '@/types/developer-dashboard/appTypes';

type ReturningUserConnectProps = {
  appData: App;
  version: number;
  readAuthInfo: UseReadAuthInfo;
};

export function ReturningUserConnect({
  appData,
  version,
  readAuthInfo,
}: ReturningUserConnectProps) {
  const navigate = useNavigate();
  const { generateJWT, isLoading, loadingStatus, error } = useJwtRedirect({ readAuthInfo });

  const handleEditParameters = () => {
    navigate(`/user/appId/${appData.appId}`);
  };

  const handleContinue = async () => {
    await generateJWT(appData, version);
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${theme.bg} sm:p-4`}>
      {/* Main Card Container */}
      <div
        className={`max-w-6xl mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden`}
      >
        {/* Header */}
        <ConnectPageHeader authInfo={readAuthInfo.authInfo!} />

        {/* Main Content */}
        <div className="px-6 py-8 space-y-6">
          {/* App Header */}
          {appData && <ConnectAppHeader app={appData} />}

          {/* Status Banner */}
          <InfoBanner
            type="success"
            title="App Already Permitted"
            message="You've previously granted permissions to this app. You can continue with your existing permissions or update them."
          />

          {/* Warning Banner */}
          {version !== appData.activeVersion && (
            <InfoBanner
              title="Version Update Available"
              message={`Your permitted version (${version}) is different from the app's active version (${appData.activeVersion}). Consider updating your permissions to access the latest features.`}
            />
          )}

          {/* Options Card */}
          <Card className={`backdrop-blur-xl ${theme.cardBg} border ${theme.cardBorder}`}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <h2 className={`text-lg font-semibold ${theme.text}`}>
                  What would you like to do?
                </h2>

                <div className="space-y-3">
                  {/* Edit Parameters Option */}
                  <ActionCard
                    icon={<Settings className="w-4 h-4 text-blue-500" />}
                    iconBg="bg-blue-500/20"
                    title="Edit Permissions"
                    description="Review and update your app permissions"
                    onClick={handleEditParameters}
                  />

                  {/* Continue Option */}
                  <ActionCard
                    icon={<ArrowRight className="w-4 h-4 text-green-500" />}
                    iconBg="bg-green-500/20"
                    title={`Continue to ${appData.name}`}
                    description="Proceed with your existing permissions"
                    onClick={handleContinue}
                    isLoading={isLoading}
                    loadingStatus={loadingStatus}
                    error={error}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
