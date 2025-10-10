import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useMemo } from 'react';
import { WalletModal } from '@/components/user-dashboard/wallet/WalletModal';
import WalletConnectPage from '@/components/user-dashboard/withdraw/WalletConnect/WalletConnect';
import { ManualWithdraw } from '@/components/user-dashboard/withdraw/manual/ManualWithdrawForm';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { useAuthGuard } from '@/hooks/user-dashboard/connect/useAuthGuard';
import { useGetAgentPkpsQuery } from '@/store/agentPkpsApi';
import { IRelayPKP } from '@lit-protocol/types';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { useWalletConnectStoreActions } from '@/components/user-dashboard/withdraw/WalletConnect/WalletConnectStore';
import Loading from '@/components/shared/ui/Loading';
import { Button } from '@/components/shared/ui/button';
import { HelpCircle } from 'lucide-react';

export function AllWallets() {
  const { authInfo, sessionSigs } = useReadAuthInfo();
  const authGuardElement = useAuthGuard();
  const [showModal, setShowModal] = useState(true);
  const [selectedPKP, setSelectedPKP] = useState<IRelayPKP | null>(null);
  const [activeTab, setActiveTab] = useState<'walletconnect' | 'manual'>('walletconnect');
  const { clearSessionsForAddress, setCurrentWalletAddress } = useWalletConnectStoreActions();

  const { data: agentPkpsData, isLoading: loading } = useGetAgentPkpsQuery(
    authInfo?.userPKP?.ethAddress || '',
    {
      skip: !authInfo?.userPKP?.ethAddress,
    },
  );

  // Memoize the unique PKPs calculation
  const allAgentPKPs = useMemo(() => {
    if (!agentPkpsData) return [];

    const { permitted, unpermitted } = agentPkpsData;

    // Collect all unique PKPs
    const pkpMap = new Map<string, IRelayPKP>();

    permitted.forEach((item) => {
      if (!pkpMap.has(item.pkp.ethAddress)) {
        pkpMap.set(item.pkp.ethAddress, item.pkp);
      }
    });

    unpermitted.forEach((item) => {
      if (!pkpMap.has(item.pkp.ethAddress)) {
        pkpMap.set(item.pkp.ethAddress, item.pkp);
      }
    });

    return Array.from(pkpMap.values());
  }, [agentPkpsData]);

  // Set first PKP as selected by default when data changes
  useEffect(() => {
    if (allAgentPKPs.length > 0 && !selectedPKP) {
      const firstPKP = allAgentPKPs[0];
      setSelectedPKP(firstPKP);
      setCurrentWalletAddress(firstPKP.ethAddress);
    }
  }, [allAgentPKPs, selectedPKP, setCurrentWalletAddress]);

  const handleReopenModal = () => {
    setShowModal(true);
  };

  const handlePKPChange = async (newPKPAddress: string) => {
    const newPKP = allAgentPKPs.find((p) => p.ethAddress === newPKPAddress);
    if (!newPKP || newPKP.ethAddress === selectedPKP?.ethAddress) return;

    // Clear sessions for the previous address
    if (selectedPKP) {
      await clearSessionsForAddress(selectedPKP.ethAddress);
    }

    // Update to the new PKP
    setSelectedPKP(newPKP);
    setCurrentWalletAddress(newPKP.ethAddress);
  };

  if (authGuardElement || !authInfo?.userPKP || !sessionSigs || loading || !selectedPKP) {
    return (
      <>
        <Helmet>
          <title>Vincent | All Wallets</title>
          <meta name="description" content="Vincent All Wallets Dashboard" />
        </Helmet>
        <div className="w-full h-full flex items-center justify-center">
          <Loading />
        </div>
      </>
    );
  }

  if (allAgentPKPs.length === 0) {
    return (
      <>
        <Helmet>
          <title>Vincent | All Wallets</title>
          <meta name="description" content="Vincent All Wallets Dashboard" />
        </Helmet>
        <div className="w-full h-full flex items-center justify-center">
          <div className={`text-center ${theme.text}`}>
            <p>No Agent PKPs found</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Vincent | All Wallets</title>
        <meta name="description" content="Your Vincent wallets dashboard" />
      </Helmet>
      <div className="w-full max-w-4xl mx-auto relative z-10 space-y-3 sm:space-y-4 lg:space-y-6">
        {/* PKP Selector */}
        <div
          className={`backdrop-blur-xl ${theme.mainCard} border ${theme.mainCardBorder} rounded-lg p-3 sm:p-4 lg:p-6`}
        >
          <label className={`text-sm font-medium ${theme.text} mb-2 block`} style={fonts.heading}>
            Select Wallet:
          </label>
          <select
            value={selectedPKP.ethAddress}
            onChange={(e) => handlePKPChange(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${theme.cardBorder} ${theme.mainCard} ${theme.text} focus:outline-none focus:ring-2`}
            style={{ ...fonts.body, '--tw-ring-color': theme.brandOrange } as React.CSSProperties}
          >
            {allAgentPKPs.map((pkp) => (
              <option
                key={pkp.ethAddress}
                value={pkp.ethAddress}
                className={`${theme.mainCard} ${theme.text}`}
              >
                {pkp.ethAddress}
              </option>
            ))}
          </select>
        </div>

        {/* Main Wallet Card */}
        <div
          className={`backdrop-blur-xl ${theme.mainCard} border ${theme.mainCardBorder} rounded-lg p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 lg:space-y-6 mb-20 sm:mb-6`}
        >
          {/* Header with Help Button */}
          <div className="flex items-center justify-between">
            <h2
              className={`text-base sm:text-lg font-semibold ${theme.text}`}
              style={fonts.heading}
            >
              {activeTab === 'walletconnect' ? 'Connect & Manage' : 'Manual Withdraw'}
            </h2>
            {showModal === false && (
              <button
                onClick={handleReopenModal}
                className={`p-1.5 rounded-md hover:${theme.itemHoverBg} transition-colors`}
                title="Connection Help"
              >
                <HelpCircle className="w-5 h-5" style={{ color: theme.brandOrange }} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="space-y-3 sm:space-y-4">
            {activeTab === 'walletconnect' ? (
              <WalletConnectPage
                agentPKP={selectedPKP}
                sessionSigs={sessionSigs}
                onSwitchToManual={() => setActiveTab('manual')}
              />
            ) : (
              <>
                <ManualWithdraw agentPKP={selectedPKP} sessionSigs={sessionSigs} />

                {/* Divider */}
                <div className={`border-t ${theme.cardBorder}`} />

                {/* Back to WalletConnect Button */}
                <Button
                  onClick={() => setActiveTab('walletconnect')}
                  variant="ghost"
                  className="w-full transition-colors"
                  style={{ color: theme.brandOrange }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  Click here to go back to WalletConnect
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <WalletModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

export default AllWallets;
