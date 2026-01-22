import { useState, useEffect } from 'react';
import { useConnect, useDisconnect } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { Wallet, AlertCircle, Loader2, ChevronDown, ChevronUp, Check, LogOut } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { useAuth } from '@/hooks/developer-dashboard/useAuth';
import { theme, fonts } from '@/lib/themeClasses';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { ExplorerNav } from '@/components/explorer/ui/ExplorerNav';
import { Footer } from '@/components/shared/Footer';

export function SignInScreen() {
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { isWalletConnected, isAuthenticated, isSigningIn, error, signIn, walletAddress } =
    useAuth();
  const isDark = useTheme();
  const navigate = useNavigate();

  // Track which steps are expanded
  const [step1Expanded, setStep1Expanded] = useState(!isWalletConnected);
  const [step2Expanded, setStep2Expanded] = useState(isWalletConnected && !isAuthenticated);

  // Update expansion state when wallet connection changes
  useEffect(() => {
    if (isWalletConnected) {
      setStep1Expanded(false);
      setStep2Expanded(true);
    } else {
      setStep1Expanded(true);
      setStep2Expanded(false);
    }
  }, [isWalletConnected]);

  const handleConnectWallet = (connectorId: string) => {
    const connector = connectors.find((c) => c.id === connectorId);
    if (connector) {
      connect({ connector });
    }
  };

  const handleSignIn = () => {
    signIn();
  };

  // Step 1 is complete when wallet is connected
  const step1Complete = isWalletConnected;

  return (
    <div
      className={cn(
        'min-h-screen min-w-screen grid grid-rows-[1fr_auto] pt-[61px] transition-colors duration-500',
        theme.bg,
      )}
      style={{
        backgroundImage: 'var(--bg-gradient)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Header */}
      <ExplorerNav onNavigate={(path) => navigate(path)} />

      {/* Main content */}
      <div className="flex items-center justify-center relative z-10 pb-20">
        <div className="w-full max-w-md mx-4">
          <div
            className={cn('border-2 rounded-2xl p-8 shadow-xl', theme.cardBg)}
            style={{ borderColor: theme.brandOrange }}
          >
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img
                src={isDark ? '/vincent-main-logo-white.png' : '/vincent-main-logo.png'}
                alt="Vincent"
                className="h-10 w-auto"
              />
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className={`text-2xl font-bold ${theme.text} mb-2`} style={fonts.heading}>
                Developer Dashboard
              </h1>
              <p className={`${theme.textMuted}`} style={fonts.body}>
                Connect your wallet to access the developer dashboard
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={`text-sm ${theme.text} font-medium`} style={fonts.heading}>
                    Sign-in Failed
                  </p>
                  <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Sign In Steps */}
            <div className="space-y-3">
              {/* Step 1: Connect Wallet */}
              <div className={`border rounded-xl overflow-hidden ${theme.cardBorder}`}>
                <button
                  onClick={() => setStep1Expanded(!step1Expanded)}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 text-left transition-colors',
                    step1Complete ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5' : '',
                  )}
                  disabled={!step1Complete}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: step1Complete ? '#22c55e' : theme.brandOrange }}
                  >
                    {step1Complete ? <Check className="w-5 h-5" /> : '1'}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${theme.text}`} style={fonts.heading}>
                      Connect Wallet
                    </p>
                    <p className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                      Use MetaMask, WalletConnect, or other supported wallets
                    </p>
                  </div>
                  {step1Complete && (
                    <div className={theme.textMuted}>
                      {step1Expanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  )}
                </button>

                {/* Step 1 Content */}
                {(step1Expanded || !step1Complete) && (
                  <div className={`px-4 pb-4 border-t ${theme.cardBorder}`}>
                    <div className="pt-4 space-y-2">
                      {isConnecting ? (
                        <Button
                          disabled
                          className="w-full h-12 text-white font-semibold"
                          style={{ backgroundColor: theme.brandOrange, opacity: 0.7 }}
                        >
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Connecting...
                        </Button>
                      ) : step1Complete ? (
                        <div className="space-y-3">
                          <div
                            className={`flex items-center gap-3 p-3 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}
                          >
                            <Wallet className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                                Connected
                              </p>
                              <p
                                className={`text-sm font-mono ${theme.text} truncate`}
                                style={fonts.body}
                              >
                                {walletAddress
                                  ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                                  : ''}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => disconnect()}
                            variant="outline"
                            className={`w-full h-10 ${theme.text}`}
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Disconnect Wallet
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {connectors.map((connector) => (
                            <Button
                              key={connector.id}
                              onClick={() => handleConnectWallet(connector.id)}
                              variant="outline"
                              className={`w-full h-10 justify-start ${theme.text}`}
                            >
                              {connector.icon && (
                                <img
                                  src={connector.icon}
                                  alt={connector.name}
                                  className="h-5 w-5 mr-2 rounded"
                                />
                              )}
                              {connector.name}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Sign Message */}
              <div className={`border rounded-xl overflow-hidden ${theme.cardBorder}`}>
                <button
                  onClick={() => step1Complete && setStep2Expanded(!step2Expanded)}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 text-left transition-colors',
                    step1Complete
                      ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5'
                      : 'opacity-50',
                  )}
                  disabled={!step1Complete}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: step1Complete ? theme.brandOrange : theme.textMuted }}
                  >
                    2
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${theme.text}`} style={fonts.heading}>
                      Sign Message
                    </p>
                    <p className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                      Verify wallet ownership with a signature (valid for 7 days)
                    </p>
                  </div>
                  {step1Complete && (
                    <div className={theme.textMuted}>
                      {step2Expanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  )}
                </button>

                {/* Step 2 Content */}
                {step1Complete && step2Expanded && (
                  <div className={`px-4 pb-4 border-t ${theme.cardBorder}`}>
                    <div className="pt-4">
                      {isSigningIn ? (
                        <Button
                          disabled
                          className="w-full h-12 text-white font-semibold"
                          style={{ backgroundColor: theme.brandOrange, opacity: 0.7 }}
                        >
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Waiting for Signature...
                        </Button>
                      ) : (
                        <Button
                          onClick={handleSignIn}
                          className="w-full h-12 text-white font-semibold"
                          style={{ backgroundColor: theme.brandOrange }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = theme.brandOrange;
                          }}
                        >
                          <Wallet className="h-5 w-5 mr-2" />
                          Sign In
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default SignInScreen;
