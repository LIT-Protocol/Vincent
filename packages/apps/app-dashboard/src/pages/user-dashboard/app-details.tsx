import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { useReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import UserAuthenticatedConsentForm from '@/components/user-dashboard/consent/UserAuthenticatedConsentForm';
import { useAuthGuard } from '@/components/user-dashboard/auth/AuthGuard';
import { useUrlRedirectUri } from '@/hooks/user-dashboard/useUrlRedirectUri';
import ConnectWithVincent from '@/layout/shared/ConnectWithVincent';
import ProtectedByLit from '@/layout/shared/ProtectedByLit';
import StatusMessage from '@/components/user-dashboard/consent/StatusMessage';
import { Card, CardContent } from '@/components/app-dashboard/ui/card';
import { ExternalLink } from 'lucide-react';
import { vincentApiClient } from '@/components/app-dashboard/mock-forms/vincentApiClient';

export default function AppDetailsPage() {
  const { authInfo, sessionSigs } = useReadAuthInfo();
  const authGuardElement = useAuthGuard();
  const { redirectUri } = useUrlRedirectUri();
  const { appId } = useParams<{ appId: string }>();

  // Get app metadata using RTK Query
  const {
    data: appMetadata,
    error: appError,
    isLoading: isLoadingApp,
  } = vincentApiClient.useGetAppQuery(
    { appId: parseInt(appId || '0') },
    { skip: !appId || isNaN(parseInt(appId || '0')) },
  );

  // Helper function to render app logo
  const renderLogo = () => {
    const logoUrl = appMetadata?.logo && appMetadata.logo.length >= 10 ? appMetadata.logo : null;
    return logoUrl ? (
      <img
        src={logoUrl}
        alt={`${appMetadata?.name} logo`}
        className="w-16 h-16 rounded-xl object-cover"
        onError={(e) => {
          e.currentTarget.src = '/logo.svg';
        }}
      />
    ) : (
      <img src="/logo.svg" alt="Vincent logo" className="w-16 h-16 rounded-xl object-cover" />
    );
  };

  if (!appId || isNaN(parseInt(appId))) {
    return (
      <>
        <Helmet>
          <title>Vincent | Invalid App</title>
          <meta name="description" content="Invalid app ID" />
        </Helmet>
        <StatusMessage message="Invalid app ID provided" type="error" />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Vincent | {appMetadata?.name || 'App Details'}</title>
        <meta name="description" content="View and manage your app parameters" />
      </Helmet>

      {authGuardElement ? (
        <StatusMessage message="Authenticating..." type="info" />
      ) : authInfo?.userPKP && authInfo?.agentPKP && sessionSigs ? (
        <div className="flex items-center justify-center p-8 min-h-screen">
          <div className="bg-white rounded-xl shadow-lg max-w-[600px] w-full border border-gray-100 overflow-hidden">
            <ConnectWithVincent signout={redirectUri ? true : false} />

            {/* Enhanced App Information Card */}
            {isLoadingApp ? (
              <div className="p-6 flex items-center justify-center">
                <StatusMessage message="Loading app details..." type="info" />
              </div>
            ) : appError ? (
              <div className="p-6">
                <StatusMessage
                  message={`Failed to load app details: ${appError.toString()}`}
                  type="error"
                />
              </div>
            ) : appMetadata ? (
              <div className="px-6 pt-6 pb-2 border-b border-gray-100">
                <Card className="border-0 shadow-none">
                  <CardContent className="p-0">
                    {/* App Header - Vertical Layout */}
                    <div className="text-center">
                      {/* Logo */}
                      <div className="flex justify-center mb-4">{renderLogo()}</div>

                      {/* Title */}
                      <div className="text-xl font-semibold mb-2 break-words">
                        {appMetadata.name}
                      </div>

                      {/* Description with Version */}
                      {appMetadata.description && (
                        <div className="text-gray-600 text-sm mb-3 break-words">
                          {appMetadata.description}
                          <br />
                          Version: {appMetadata.activeVersion}
                        </div>
                      )}

                      {/* App Details - Smaller and below description */}
                      <div className="space-y-1 text-xs text-gray-500">
                        {appMetadata.appUserUrl && (
                          <div className="flex items-center justify-center gap-1">
                            <span>App URL:</span>
                            <a
                              href={appMetadata.appUserUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              {appMetadata.appUserUrl}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}

                        {appMetadata.contactEmail && (
                          <div className="flex items-center justify-center gap-1">
                            <span>Contact:</span>
                            <a
                              href={`mailto:${appMetadata.contactEmail}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {appMetadata.contactEmail}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            <div className="p-6">
              <UserAuthenticatedConsentForm
                userPKP={authInfo.userPKP}
                sessionSigs={sessionSigs}
                agentPKP={authInfo.agentPKP}
              />
            </div>
            <ProtectedByLit />
          </div>
        </div>
      ) : (
        <div className="flex min-h-screen items-center justify-center">
          <StatusMessage message="Authentication required" type="warning" />
        </div>
      )}
    </>
  );
}
