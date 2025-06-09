import { Helmet } from 'react-helmet';
import { useParams } from 'react-router-dom';
import { useReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import UserAuthenticatedConsentForm from '@/components/user-dashboard/consent/UserAuthenticatedConsentForm';
import { useAuthGuard } from '@/components/user-dashboard/auth/AuthGuard';
import { useUrlRedirectUri } from '@/hooks/user-dashboard/useUrlRedirectUri';
import ConnectWithVincent from '@/layout/shared/ConnectWithVincent';
import ProtectedByLit from '@/layout/shared/ProtectedByLit';
import StatusMessage from '@/components/user-dashboard/consent/StatusMessage';
import Loading from '@/layout/app-dashboard/Loading';
import { Card, CardContent } from '@/components/app-dashboard/ui/card';
import { ExternalLink } from 'lucide-react';
import { vincentApiClient } from '@/components/app-dashboard/mock-forms/vincentApiClient';

export default function AppDetailsPage() {
  const { authInfo, sessionSigs } = useReadAuthInfo();
  const authGuardElement = useAuthGuard();
  const { redirectUri } = useUrlRedirectUri();
  const { appId } = useParams();

  // Convert appId to number for the API call
  const appIdNumber = appId ? parseInt(appId, 10) : 0;

  // Use Vincent API client to fetch app data
  const {
    data: appMetadata,
    error: appError,
    isLoading: isLoadingApp,
  } = vincentApiClient.useGetAppQuery(
    { appId: appIdNumber },
    { skip: !appId || isNaN(appIdNumber) },
  );

  // Helper function to render app logo
  const renderLogo = () => {
    if (appMetadata?.logo) {
      const logoSrc = appMetadata.logo.startsWith('data:')
        ? appMetadata.logo
        : `data:image/png;base64,${appMetadata.logo}`;

      return (
        <img
          src={logoSrc}
          alt={`${appMetadata.name} logo`}
          className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
          onError={(e) => {
            e.currentTarget.src = '/logo.svg';
          }}
        />
      );
    }

    return (
      <img
        src="/logo.svg"
        alt="Vincent logo"
        className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
      />
    );
  };

  return (
    <>
      <Helmet>
        <title>Vincent | {appMetadata?.name || 'App Details'}</title>
        <meta name="description" content="View and manage your app parameters" />
      </Helmet>

      {authGuardElement ? (
        <div className="flex min-h-screen items-center justify-center">
          <Loading />
        </div>
      ) : authInfo?.userPKP && authInfo?.agentPKP && sessionSigs ? (
        <div className="flex items-center justify-center p-8 min-h-screen">
          <div className="bg-white rounded-xl shadow-lg max-w-[600px] w-full border border-gray-100 overflow-hidden">
            <ConnectWithVincent signout={redirectUri ? true : false} />

            {/* Enhanced App Information Card */}
            {isLoadingApp ? (
              <div className="p-6 flex items-center justify-center">
                <Loading />
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
