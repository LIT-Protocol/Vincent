import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Shield, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { IRelayPKP } from '@lit-protocol/types';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import * as Sentry from '@sentry/react';

import { theme, fonts } from './ui/theme';
import { InfoBanner } from './ui/InfoBanner';
import { ActionCard } from './ui/ActionCard';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';
import { useCanGoBack } from '@/hooks/user-dashboard/connect/useCanGoBack';
import { ReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { litNodeClient } from '@/utils/user-dashboard/lit';
import { App } from '@/types/developer-dashboard/appTypes';

type DeletedAppErrorScreenProps = {
  appData: App;
  hasPermission: boolean;
  agentPKP: IRelayPKP | undefined;
  permittedVersion: number | null;
  readAuthInfo: ReadAuthInfo;
};

export function DeletedAppErrorScreen({
  appData,
  hasPermission,
  agentPKP,
  permittedVersion,
  readAuthInfo,
}: DeletedAppErrorScreenProps) {
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();
  const { authInfo, sessionSigs } = readAuthInfo;

  const [isUnpermitting, setIsUnpermitting] = useState(false);
  const [unpermitError, setUnpermitError] = useState<string | null>(null);
  const [unpermitSuccess, setUnpermitSuccess] = useState(false);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleViewWallet = () => {
    navigate(`/user/appId/${appData.appId}/wallet`);
  };

  const handleUnpermit = useCallback(async () => {
    if (!agentPKP || !authInfo?.userPKP || !sessionSigs || permittedVersion === null) {
      setUnpermitError('Missing authentication information');
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
          context: 'DeletedAppErrorScreen.handleUnpermit',
        },
      });
    } finally {
      setIsUnpermitting(false);
    }
  }, [agentPKP, authInfo, sessionSigs, appData.appId, permittedVersion, navigate]);

  return (
    <div className="w-full max-w-4xl mx-auto relative z-10 space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb
        items={[{ label: 'Apps', onClick: () => navigate('/user/apps') }, { label: appData.name }]}
      />

      {/* Main Content Card */}
      <div
        className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-xl overflow-hidden`}
      >
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
              message="This app has been deleted by the developer."
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
              {/* Error Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className={`text-sm font-semibold ${theme.text}`} style={fonts.heading}>
                    What You Can Do
                  </h2>
                </div>

                <div className={`p-3 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}>
                  <p className={`text-xs ${theme.textMuted}`}>
                    {hasPermission
                      ? 'While the app is deleted, you can still revoke permissions and access your wallet to view your balance and withdraw any remaining funds. The developer may undelete this app in the future.'
                      : 'You have revoked permissions for this app. You can still access your wallet to view your balance and withdraw any remaining funds.'}
                  </p>
                </div>
              </div>

              {/* Dividing line */}
              <div className={`border-b ${theme.cardBorder}`}></div>

              {/* Options */}
              <div className="space-y-3">
                {/* View Wallet Option */}
                <ActionCard
                  icon={<Wallet className="w-4 h-4" style={{ color: '#FF4205' }} />}
                  iconBg="bg-orange-500/20"
                  title="View Wallet"
                  description="Access your wallet to withdraw funds"
                  onClick={handleViewWallet}
                  disabled={isUnpermitting}
                />

                {/* Unpermit Option - only show if app is still permitted */}
                {hasPermission && (
                  <ActionCard
                    icon={
                      isUnpermitting ? (
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                      ) : (
                        <Shield className="w-4 h-4 text-blue-500" />
                      )
                    }
                    iconBg="bg-blue-500/20"
                    title={isUnpermitting ? 'Revoking...' : 'Revoke Permissions'}
                    description={isUnpermitting ? '' : "Remove this app's access to your wallet"}
                    onClick={handleUnpermit}
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
    </div>
  );
}
