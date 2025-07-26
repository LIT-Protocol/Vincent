import { Card, CardContent } from '@/components/shared/ui/card';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { theme } from './ui/theme';
import { ConsentAppHeader } from './ui/ConsentAppHeader';
import { ConsentPageHeader } from './ui/ConsentPageHeader';
import { ActionCard } from './ui/ActionCard';
import { useNavigate } from 'react-router-dom';
import { UseReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { App } from '@/types/developer-dashboard/appTypes';
import { useTheme } from '@/providers/ThemeProvider';

type AppVersionNotInRegistryConsentProps = {
  appData: App;
  readAuthInfo: UseReadAuthInfo;
};

export function AppVersionNotInRegistryConsent({
  appData,
  readAuthInfo,
}: AppVersionNotInRegistryConsentProps) {
  const { isDark, toggleTheme } = useTheme();
  const themeStyles = theme(isDark);
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRetry = () => {
    // Force a page refresh to re-check the registry
    window.location.reload();
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${themeStyles.bg} sm:p-4`}>
      {/* Main Card Container */}
      <div
        className={`max-w-6xl mx-auto ${themeStyles.mainCard} border ${themeStyles.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden`}
      >
        {/* Header */}
        <ConsentPageHeader
          isDark={isDark}
          onToggleTheme={toggleTheme}
          theme={themeStyles}
          authInfo={readAuthInfo.authInfo!}
        />

        {/* Main Content */}
        <div className="px-6 py-8 space-y-6">
          {/* App Header */}
          {appData && <ConsentAppHeader app={appData} theme={themeStyles} />}

          {/* Info Card */}
          <Card
            className={`backdrop-blur-xl ${themeStyles.cardBg} border ${themeStyles.cardBorder}`}
          >
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-semibold ${themeStyles.text}`}>
                      Version Publication Required
                    </h2>
                    <p className={`text-sm ${themeStyles.textMuted} mt-1`}>
                      The app developer must publish version {appData.activeVersion} on-chain before
                      permissions can be granted for this version.
                    </p>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg ${themeStyles.cardBg} border ${themeStyles.cardBorder}`}
                >
                  <h3 className={`text-sm font-medium ${themeStyles.text} mb-2`}>
                    What needs to happen:
                  </h3>
                  <ul className={`text-sm ${themeStyles.textMuted} space-y-1`}>
                    <li>
                      • The app developer must publish version {appData.activeVersion} in the
                      on-chain registry
                    </li>
                    <li>• Once published, you'll be able to grant permissions for this version</li>
                    <li>• Contact the app developer if you need assistance</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Options Card */}
          <Card
            className={`backdrop-blur-xl ${themeStyles.cardBg} border ${themeStyles.cardBorder}`}
          >
            <CardContent className="p-6">
              <div className="space-y-4">
                <h2 className={`text-lg font-semibold ${themeStyles.text}`}>
                  What would you like to do?
                </h2>

                <div className="space-y-3">
                  {/* Go Back Option */}
                  <ActionCard
                    theme={themeStyles}
                    icon={<ArrowLeft className="w-4 h-4 text-blue-500" />}
                    iconBg="bg-blue-500/20"
                    title="Go Back"
                    description="Return to the previous page"
                    onClick={handleGoBack}
                  />

                  {/* Retry Option */}
                  <ActionCard
                    theme={themeStyles}
                    icon={<RefreshCw className="w-4 h-4 text-green-500" />}
                    iconBg="bg-green-500/20"
                    title="Check Again"
                    description="Refresh to check if the version has been published"
                    onClick={handleRetry}
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
