import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Shield, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import * as Sentry from '@sentry/react';

import { theme } from './ui/theme';
import { InfoBanner } from './ui/InfoBanner';
import { ActionCard } from './ui/ActionCard';
import { ConnectPageHeader } from './ui/ConnectPageHeader';
import { useCanGoBack } from '@/hooks/user-dashboard/connect/useCanGoBack';
import { ReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { useAgentPkpForApp } from '@/hooks/user-dashboard/useAgentPkpForApp';
import { litNodeClient } from '@/utils/user-dashboard/lit';
import { App } from '@/types/developer-dashboard/appTypes';

type DeletedAppConnectProps = {
  appData: App;
  hasPermission: boolean;
  readAuthInfo: ReadAuthInfo;
};

export function DeletedAppConnect({
  appData,
  hasPermission,
  readAuthInfo,
}: DeletedAppConnectProps) {
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();
  const { authInfo, sessionSigs } = readAuthInfo;
  const userAddress = authInfo?.userPKP?.ethAddress || '';

  const [isUnpermitting, setIsUnpermitting] = useState(false);
  const [unpermitError, setUnpermitError] = useState<string | null>(null);
  const [unpermitSuccess, setUnpermitSuccess] = useState(false);

  const { agentPKP, permittedVersion } = useAgentPkpForApp(userAddress, appData.appId);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleViewWallet = () => {
    navigate(`/user/appId/${appData.appId}/wallet`);
  };

  const handleUnpermit = useCallback(async () => {
    if (!agentPKP || !authInfo?.userPKP || !sessionSigs) {
      setUnpermitError('Missing authentication information');
      return;
    }

    if (permittedVersion === null) {
      setUnpermitError('App is not currently permitted');
      return;
    }

    try {
      setIsUnpermitting(true);
      setUnpermitError(null);

      const agentPkpWallet = new PKPEthersWallet({
        controllerSessionSigs: sessionSigs,
        pkpPubKey: authInfo.userPKP.publicKey,
        litNodeClient: litNodeClient,
      });
      await agentPkpWallet.init();

      const client = getClient({ signer: agentPkpWallet });
      await client.unPermitApp({
        pkpEthAddress: agentPKP.ethAddress,
        appId: Number(appData.appId),
        appVersion: Number(permittedVersion),
      });

      setUnpermitSuccess(true);
      // Force a full page reload to refresh all data
      window.location.href = '/user/apps';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke permissions';
      setUnpermitError(errorMessage);
      Sentry.captureException(err, {
        extra: {
          appId: appData.appId,
          agentPKPAddress: agentPKP?.ethAddress,
          permittedVersion,
          context: 'DeletedAppConnect.handleUnpermit',
        },
      });
    } finally {
      setIsUnpermitting(false);
    }
  }, [agentPKP, authInfo, sessionSigs, appData.appId, permittedVersion, navigate]);

  return (
    <div
      className={`w-full max-w-md mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden relative z-10 origin-center`}
    >
      {/* Header */}
      <ConnectPageHeader authInfo={authInfo || undefined} />

      {/* Main Content */}
      <div className="px-3 sm:px-4 py-6 sm:py-8 space-y-6">
        {/* Status Banner */}
        {unpermitSuccess ? (
          <InfoBanner
            type="success"
            title="Permissions Revoked"
            message="The app no longer has access to your wallet."
          />
        ) : (
          <InfoBanner
            type="red"
            title="App Deleted"
            message="This app has been deleted by the developer and is no longer available."
          />
        )}

        {/* Error Message */}
        {unpermitError && (
          <div className={`p-3 rounded-lg bg-red-500/10 border border-red-500/30`}>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className={`text-xs text-red-500`}>{unpermitError}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {unpermitSuccess && (
          <div className={`p-3 rounded-lg bg-green-500/10 border border-green-500/30`}>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <p className={`text-xs text-green-500`}>Redirecting to your permitted apps...</p>
            </div>
          </div>
        )}

        {!unpermitSuccess && (
          <>
            {/* Dividing line */}
            <div className={`border-b ${theme.cardBorder}`}></div>

            {/* Options */}
            <div className="space-y-3">
              {/* Revoke Permissions - primary action if permitted */}
              {hasPermission && (
                <ActionCard
                  icon={
                    isUnpermitting ? (
                      <Loader2
                        className="w-4 h-4 animate-spin"
                        style={{ color: theme.brandOrange }}
                      />
                    ) : (
                      <Shield className="w-4 h-4" style={{ color: theme.brandOrange }} />
                    )
                  }
                  iconBg="bg-orange-500/20"
                  title={isUnpermitting ? 'Revoking...' : 'Revoke Permissions'}
                  description={isUnpermitting ? '' : "Remove this app's access to your wallet"}
                  onClick={handleUnpermit}
                  disabled={isUnpermitting}
                />
              )}

              {/* View Wallet Option - only if permitted */}
              {hasPermission && (
                <ActionCard
                  icon={<Wallet className="w-4 h-4" style={{ color: theme.brandOrange }} />}
                  iconBg="bg-orange-500/20"
                  title="View Wallet"
                  description="Access your wallet to withdraw funds"
                  onClick={handleViewWallet}
                  disabled={isUnpermitting}
                />
              )}

              {/* Go Back Option */}
              <ActionCard
                icon={<ArrowLeft className="w-4 h-4 text-gray-500" />}
                iconBg="bg-gray-500/20"
                title="Go Back"
                description=""
                onClick={handleGoBack}
                disabled={!canGoBack || isUnpermitting}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
