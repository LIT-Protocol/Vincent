import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { Button } from '@/components/shared/ui/button';
import { Copy, RefreshCw, ExternalLink } from 'lucide-react';
import { VincentYieldConsent } from './VincentYieldConsent';
import { useConnectInfo } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { UseReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { ConnectPageSkeleton } from '../connect/ConnectPageSkeleton';
import { GeneralErrorScreen } from '../connect/GeneralErrorScreen';
import { useUSDCBalance } from '@/hooks/user-dashboard/dashboard/useUSDCBalance';
import { useFetchVincentYieldPerms } from '@/hooks/user-dashboard/dashboard/useFetchVincentYieldPerms';
import { theme } from '../connect/ui/theme';

interface VincentYieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentPkpAddress: string;
  readAuthInfo: UseReadAuthInfo;
}

const VINCENT_YIELD_APPID = '5731522461';

export function VincentYieldModal({
  isOpen,
  onClose,
  agentPkpAddress,
  readAuthInfo,
}: VincentYieldModalProps) {
  const [currentView, setCurrentView] = useState<'welcome' | 'consent' | 'deposit'>('welcome');
  const [copied, setCopied] = useState(false);

  // Fetch USDC balance for the PKP address
  const {
    balanceFormatted,
    isLoading: balanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useUSDCBalance({
    address: agentPkpAddress,
  });

  // Check if Vincent Yield permissions already exist
  const {
    result: hasVincentYieldPerms,
    isLoading: vincentYieldPermsLoading,
    error: vincentYieldPermsError,
  } = useFetchVincentYieldPerms({
    pkpEthAddress: agentPkpAddress,
  });

  // Only fetch Vincent Yield app data when user wants to proceed with consent AND doesn't already have permissions
  const shouldFetchConsentData = currentView === 'consent' && !hasVincentYieldPerms;
  const {
    isLoading: connectInfoLoading,
    isError: connectInfoError,
    data: connectInfoData,
  } = useConnectInfo(shouldFetchConsentData ? VINCENT_YIELD_APPID : '');
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setCurrentView('welcome');
    }
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(agentPkpAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDeposit = () => {
    setCurrentView('deposit');
  };

  const handleConsentComplete = () => {
    setCurrentView('deposit');
  };

  const handleBack = () => {
    if (currentView === 'deposit') {
      setCurrentView('welcome');
    } else if (currentView === 'consent') {
      setCurrentView('deposit');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`w-full max-w-2xl ${theme.mainCard} border ${theme.mainCardBorder} max-h-[80vh] overflow-y-auto`}
      >
        {currentView === 'welcome' ? (
          <>
            <DialogHeader className="pb-6">
              <DialogTitle className={`text-2xl font-bold ${theme.text} mb-2`}>
                Vincent (Early Access) — Now Live! 🚀
              </DialogTitle>
              <DialogDescription className={`text-base ${theme.textMuted} leading-relaxed`}>
                Welcome to the next wave of user-owned finance and agentic automation. Starting
                today, anyone can join Vincent and use agents that are constantly working for you,
                backed by decentralized keys, on-chain guardrails, and a growing ecosystem.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-8">
              <div className={`p-6 rounded-xl ${theme.cardBg} border ${theme.cardBorder}`}>
                <h3 className={`text-xl font-semibold ${theme.text} mb-4`}>
                  Sign-Up → Instant Earnings
                </h3>
                <div className="space-y-4">
                  <p className={`text-sm ${theme.textMuted} mb-3 leading-relaxed`}>
                    Vincent Yield arrives pre-installed. The moment you deposit, your stablecoins
                    are automatically routed to the highest-yield pools.
                  </p>
                  <p className={`text-sm ${theme.textMuted} mb-3 leading-relaxed`}>
                    No settings, no complexity. Your balance simply earns 24/7, and you see the APY
                    and dollars-earned line right on your dashboard.
                  </p>
                  <p className={`text-sm ${theme.textMuted} leading-relaxed`}>
                    Beyond non-custodial: your funds and signing authority stay under decentralized
                    key-shares, with controls onchain enforcing exactly what each agent can (and
                    cannot) do.
                  </p>
                </div>
              </div>

              <div className={`p-6 rounded-xl ${theme.cardBg} border ${theme.cardBorder}`}>
                <h4 className={`text-lg font-medium ${theme.text} mb-3`}>
                  Vincent is Your Console for Autonomous Finance
                </h4>
                <div className="space-y-3">
                  <p className={`text-sm ${theme.textMuted} leading-relaxed`}>
                    View, pause, or remove agents in one clean interface.
                  </p>
                  <p className={`text-sm ${theme.textMuted} leading-relaxed`}>
                    Vincent's onchain guardrails guarantee that every agent action respects the
                    permissions you agree to.
                  </p>
                  <p className={`text-sm ${theme.textMuted} leading-relaxed`}>
                    All future agents, from AI quants to Degen bots —will plug in the same way,
                    keeping your security model intact.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-8 border-t border-gray-100 dark:border-white/10">
              <Button
                onClick={onClose}
                variant="outline"
                className={`${theme.itemBg} ${theme.text} border ${theme.cardBorder} hover:${theme.itemHoverBg}`}
              >
                Close
              </Button>
              <Button
                onClick={handleDeposit}
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
              >
                Get Started
              </Button>
            </div>
          </>
        ) : currentView === 'consent' ? (
          <>
            <DialogHeader className="pb-6">
              <DialogTitle className={`text-2xl font-bold ${theme.text} mb-2`}>
                Grant Vincent Yield Permissions
              </DialogTitle>
              <DialogDescription className={`text-base ${theme.textMuted} leading-relaxed`}>
                Review and approve the permissions required for Vincent Yield to manage your funds.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6">
              {vincentYieldPermsLoading ? (
                <ConnectPageSkeleton />
              ) : vincentYieldPermsError ? (
                <GeneralErrorScreen errorDetails={vincentYieldPermsError} />
              ) : hasVincentYieldPerms ? (
                <div
                  className={`text-center py-12 px-6 rounded-xl ${theme.cardBg} border ${theme.cardBorder}`}
                >
                  <div className="mb-6">
                    <div
                      className={`w-20 h-20 ${theme.successBg} rounded-full flex items-center justify-center mx-auto mb-6`}
                    >
                      <svg
                        className={`w-10 h-10 ${theme.successText}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className={`text-xl font-semibold ${theme.text} mb-3`}>
                      Already Connected!
                    </h3>
                    <p className={`text-base ${theme.textMuted} leading-relaxed max-w-md mx-auto`}>
                      Vincent Yield is already set up and ready to earn on your deposits.
                    </p>
                  </div>
                  <Button
                    onClick={handleConsentComplete}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-6"
                  >
                    Continue to Deposit
                  </Button>
                </div>
              ) : connectInfoLoading ? (
                <ConnectPageSkeleton />
              ) : connectInfoError ? (
                <GeneralErrorScreen
                  errorDetails={
                    connectInfoData?.errors?.join(', ') || 'Failed to load consent data'
                  }
                />
              ) : connectInfoData ? (
                <VincentYieldConsent
                  connectInfoMap={connectInfoData}
                  readAuthInfo={readAuthInfo}
                  onSuccess={handleConsentComplete}
                  onCancel={handleBack}
                />
              ) : null}
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="pb-6">
              <DialogTitle className={`text-2xl font-bold ${theme.text} mb-2`}>
                Deposit USDC to Start Earning
              </DialogTitle>
              <DialogDescription className={`text-base ${theme.textMuted} leading-relaxed`}>
                Send USDC on Base network to your agent address to start earning yield
                automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Agent Address Section */}
              <div>
                <h4 className={`text-lg font-semibold ${theme.text} mb-3`}>Your Agent Address</h4>
                <div
                  className={`flex items-center gap-3 p-4 ${theme.itemBg} border ${theme.cardBorder} rounded-lg`}
                >
                  <code className={`flex-1 text-sm font-mono break-all ${theme.text}`}>
                    {agentPkpAddress}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAddress}
                    className={`flex items-center gap-2 shrink-0 ${theme.itemBg} ${theme.text} border ${theme.cardBorder} hover:${theme.itemHoverBg}`}
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>

                {/* Balance and BaseScan link in a simple row */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${theme.textMuted}`}>Balance:</span>
                    {balanceLoading ? (
                      <span className={`text-sm ${theme.textMuted}`}>Loading...</span>
                    ) : balanceError ? (
                      <button
                        onClick={refetchBalance}
                        className="text-sm text-red-500 hover:text-red-700 underline"
                      >
                        Error - retry
                      </button>
                    ) : (
                      <>
                        <span className="text-sm font-mono font-medium text-green-600 dark:text-green-400">
                          ${balanceFormatted || '0.00'} USDC
                        </span>
                        <button
                          onClick={refetchBalance}
                          className={`p-1 hover:${theme.itemHoverBg} rounded ${theme.textMuted} hover:${theme.text}`}
                          title="Refresh balance"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                  <a
                    href={`https://basescan.org/address/${agentPkpAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs ${theme.linkColor} flex items-center gap-1`}
                  >
                    View on BaseScan <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h4 className={`text-lg font-semibold ${theme.text} mb-3`}>How to Deposit</h4>
                <ol
                  className={`list-decimal list-inside space-y-2 text-sm ${theme.textMuted} ml-2`}
                >
                  <li>Copy the agent address above</li>
                  <li>Open your wallet (MetaMask, Coinbase Wallet, etc.)</li>
                  <li>Switch to Base network</li>
                  <li>Send USDC to the copied address</li>
                  <li>Your funds will automatically start earning yield!</li>
                </ol>
              </div>
            </div>

            <div className="flex justify-between gap-4 pt-8 border-t border-gray-100 dark:border-white/10">
              <Button
                onClick={handleBack}
                variant="outline"
                className={`${theme.itemBg} ${theme.text} border ${theme.cardBorder} hover:${theme.itemHoverBg}`}
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentView('consent')}
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-6"
              >
                Grant Permissions
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
