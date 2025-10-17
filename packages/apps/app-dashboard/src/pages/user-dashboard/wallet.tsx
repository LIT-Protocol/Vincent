import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router';
import { useState } from 'react';
import { WalletModal } from '@/components/user-dashboard/wallet/WalletModal';
import { WalletPageHeader } from '@/components/user-dashboard/wallet/WalletPageHeader';
import WalletConnectPage from '@/components/user-dashboard/withdraw/WalletConnect/WalletConnect';
import { ManualWithdraw } from '@/components/user-dashboard/withdraw/manual/ManualWithdrawForm';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { Button } from '@/components/shared/ui/button';
import { HelpCircle } from 'lucide-react';
import { SessionSigs, IRelayPKP } from '@lit-protocol/types';
import { App } from '@/types/developer-dashboard/appTypes';

export interface WalletProps {
  appData: App;
  agentPKP: IRelayPKP;
  sessionSigs: SessionSigs;
}

export function Wallet({ appData, agentPKP, sessionSigs }: WalletProps) {
  const { appId } = useParams();
  const [showModal, setShowModal] = useState(true);
  const [activeTab, setActiveTab] = useState<'walletconnect' | 'manual'>('walletconnect');

  const handleReopenModal = () => {
    setShowModal(true);
  };

  return (
    <>
      <Helmet>
        <title>Vincent | {appData.name} Wallet</title>
        <meta name="description" content={`${appData.name} Vincent wallet dashboard`} />
      </Helmet>
      <div className="w-full max-w-4xl mx-auto relative z-10 space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Wallet Page Header */}
        <WalletPageHeader
          appId={appId!}
          appName={appData.name}
          appLogo={appData.logo}
          appDescription={appData.description}
          walletAddress={agentPKP.ethAddress}
        />

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
                <HelpCircle className="w-5 h-5" style={{ color: '#FF4205' }} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="space-y-3 sm:space-y-4">
            {activeTab === 'walletconnect' ? (
              <WalletConnectPage
                agentPKP={agentPKP}
                sessionSigs={sessionSigs}
                onSwitchToManual={() => setActiveTab('manual')}
              />
            ) : (
              <>
                <ManualWithdraw agentPKP={agentPKP} sessionSigs={sessionSigs} />

                {/* Divider */}
                <div className={`border-t ${theme.cardBorder}`} />

                {/* Back to WalletConnect Button */}
                <Button
                  onClick={() => setActiveTab('walletconnect')}
                  variant="ghost"
                  className="w-full transition-colors"
                  style={{ color: '#FF4205' }}
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

export default Wallet;
