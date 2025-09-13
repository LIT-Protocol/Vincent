import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { WithdrawForm } from '@/components/user-dashboard/withdraw/WithdrawForm';
import { WithdrawFormSkeleton } from '@/components/user-dashboard/withdraw/WithdrawFormSkeleton';
import { WalletModal } from '@/components/user-dashboard/wallet/WalletModal';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { useAuthGuard } from '@/hooks/user-dashboard/connect/useAuthGuard';
import { getAgentPkps } from '@/utils/user-dashboard/getAgentPkps';
import { IRelayPKP } from '@lit-protocol/types';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { useWalletConnectStoreActions } from '@/components/user-dashboard/withdraw/WalletConnect/WalletConnectStore';

export function AllWallets() {
  const { authInfo, sessionSigs } = useReadAuthInfo();
  const authGuardElement = useAuthGuard();
  const [showModal, setShowModal] = useState(true);
  const [selectedPKP, setSelectedPKP] = useState<IRelayPKP | null>(null);
  const [allAgentPKPs, setAllAgentPKPs] = useState<IRelayPKP[]>([]);
  const [loading, setLoading] = useState(true);
  const { clearSessionsForAddress, setCurrentWalletAddress } = useWalletConnectStoreActions();

  useEffect(() => {
    const fetchAgentPKPs = async () => {
      if (!authInfo?.userPKP?.ethAddress) {
        setLoading(false);
        return;
      }

      try {
        const { permitted, unpermitted } = await getAgentPkps(authInfo.userPKP.ethAddress);

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

        const uniquePKPs = Array.from(pkpMap.values());
        setAllAgentPKPs(uniquePKPs);

        // Set first PKP as selected by default
        if (uniquePKPs.length > 0) {
          const firstPKP = uniquePKPs[0];
          setSelectedPKP(firstPKP);
          setCurrentWalletAddress(firstPKP.ethAddress);
        }
      } catch (error) {
        console.error('Failed to fetch agent PKPs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentPKPs();
  }, [authInfo?.userPKP?.ethAddress]);

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
          <WithdrawFormSkeleton />
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
      <div className="w-full h-full flex flex-col items-center justify-center">
        {/* PKP Selector Dropdown */}
        <div className="max-w-xl w-full mx-auto mb-4">
          <div
            className={`flex items-center gap-3 p-4 rounded-lg ${theme.mainCard} border ${theme.mainCardBorder}`}
          >
            <label className={`text-sm font-medium ${theme.text}`}>Select Vincent Wallet:</label>
            <select
              value={selectedPKP.ethAddress}
              onChange={(e) => handlePKPChange(e.target.value)}
              className={`flex-1 px-3 py-2 rounded-lg border ${theme.cardBorder} ${theme.mainCard} ${theme.text} focus:outline-none focus:ring-2 focus:ring-orange-500`}
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
        </div>

        {/* Wallet Form */}
        <WithdrawForm
          sessionSigs={sessionSigs}
          agentPKP={selectedPKP}
          onHelpClick={handleReopenModal}
          showHelpButton={!showModal}
        />
      </div>
      <WalletModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

export default AllWallets;
