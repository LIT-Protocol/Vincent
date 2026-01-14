import { useState } from 'react';
import { useConnect } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { Wallet, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { useAuth } from '@/hooks/developer-dashboard/useAuth';
import { theme, fonts } from '@/lib/themeClasses';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { ExplorerNav } from '@/components/explorer/ui/ExplorerNav';
import { Footer } from '@/components/shared/Footer';

export function SignInScreen() {
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const [showConnectors, setShowConnectors] = useState(false);
  const { isWalletConnected, isAuthenticated, isSigningIn, error, signIn } = useAuth();
  const isDark = useTheme();
  const navigate = useNavigate();

  const handleConnectWallet = (connectorId: string) => {
    const connector = connectors.find((c) => c.id === connectorId);
    if (connector) {
      connect({ connector });
      setShowConnectors(false);
    }
  };

  const handleSignIn = () => {
    signIn();
  };

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

            {/* Sign In States */}
            {!isWalletConnected ? (
              // Step 1: Connect Wallet
              <div className="space-y-4">
                {isConnecting ? (
                  <Button
                    disabled
                    className="w-full h-12 text-white font-semibold"
                    style={{ backgroundColor: theme.brandOrange, opacity: 0.7 }}
                  >
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Connecting...
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      onClick={() => setShowConnectors(!showConnectors)}
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
                      Connect Wallet
                      {showConnectors ? (
                        <ChevronUp className="h-4 w-4 ml-2" />
                      ) : (
                        <ChevronDown className="h-4 w-4 ml-2" />
                      )}
                    </Button>
                    {showConnectors && (
                      <div
                        className={`space-y-2 p-3 rounded-lg border ${theme.cardBorder} ${theme.cardBg}`}
                      >
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
                )}
                <p className={`text-xs text-center ${theme.textMuted}`} style={fonts.body}>
                  Connect your wallet to get started
                </p>
              </div>
            ) : !isAuthenticated ? (
              // Step 2: Sign Message
              <div className="space-y-4">
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
                    Sign In
                  </Button>
                )}
                <p className={`text-xs text-center ${theme.textMuted}`} style={fonts.body}>
                  Sign a message to verify your wallet ownership
                </p>
              </div>
            ) : null}

            {/* Info */}
            <div className={`mt-8 pt-6 border-t ${theme.cardBorder}`}>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: theme.brandOrange }}
                  >
                    1
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${theme.text}`} style={fonts.heading}>
                      Connect Wallet
                    </p>
                    <p className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                      Use MetaMask, WalletConnect, or other supported wallets
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: theme.brandOrange }}
                  >
                    2
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${theme.text}`} style={fonts.heading}>
                      Sign Message
                    </p>
                    <p className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                      Verify wallet ownership with a signature (valid for 7 days)
                    </p>
                  </div>
                </div>
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
