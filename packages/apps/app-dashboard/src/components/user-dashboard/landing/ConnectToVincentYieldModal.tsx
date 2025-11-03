import { useState } from 'react';
import { IRelayPKP } from '@lit-protocol/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { theme, fonts } from '../connect/ui/theme';
import { AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { env } from '@/config/env';

interface ConnectToVincentYieldModalProps {
  agentPKP: IRelayPKP;
  onClose?: () => void;
}

export function ConnectToVincentYieldModal({ agentPKP }: ConnectToVincentYieldModalProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleConnect = () => {
    setIsRedirecting(true);
    const redirectUri = encodeURIComponent('https://yield.heyvincent.ai');
    const connectUrl = `${window.location.origin}/user/appId/${env.VITE_VINCENT_YIELD_APPID}/connect?redirectUri=${redirectUri}`;
    window.location.href = connectUrl;
  };

  return (
    <Dialog open={true} onOpenChange={undefined}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        button[class*="absolute top-4 right-4"] {
          display: none !important;
        }
      `}</style>
      <DialogContent
        className="w-[calc(100%-1rem)] max-w-md border-2 rounded-2xl shadow-2xl overflow-hidden p-0 backdrop-blur-xl"
        style={{
          borderColor: theme.brandOrange,
          background: `linear-gradient(135deg, ${theme.mainCard} 0%, rgba(224, 90, 26, 0.05) 100%)`,
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* REQUIRED badge */}
        <div
          className="absolute top-4 right-4 px-2 py-1 rounded-md text-xs font-bold tracking-wide z-10"
          style={{
            backgroundColor: theme.brandOrange,
            color: 'white',
            ...fonts.heading,
          }}
        >
          REQUIRED
        </div>

        <DialogHeader className={`px-4 sm:px-6 pt-6 pb-4`}>
          {/* Logo and Title */}
          <div className="flex items-center gap-3 mb-4 pr-20">
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: theme.brandOrange,
              }}
            >
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="flex flex-col justify-center min-w-0 flex-1">
              <DialogTitle
                className={`text-base font-semibold leading-tight ${theme.text} break-words`}
                style={fonts.heading}
              >
                Connect to Vincent Yield
              </DialogTitle>
              <span className={`text-sm leading-tight`} style={{ color: theme.brandOrange }}>
                Migration Required
              </span>
            </div>
          </div>

          <DialogDescription
            className={`${theme.textMuted} text-xs leading-relaxed`}
            style={fonts.body}
          >
            Your existing Vincent Wallet needs to be connected to Vincent Yield due to architectural
            improvements.
          </DialogDescription>
        </DialogHeader>

        <div className="px-3 sm:px-6 pt-4 pb-4">
          <div className={`rounded-lg border ${theme.cardBorder} ${theme.itemBg} p-4`}>
            <div className="space-y-3">
              <div>
                <div className={`text-xs font-medium ${theme.textMuted} mb-1`}>
                  Your existing Vincent Wallet
                </div>
                <code className={`font-mono text-xs ${theme.text} break-all`}>
                  {agentPKP.ethAddress}
                </code>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-orange-50/50 dark:bg-orange-900/10 rounded-lg border border-orange-200/50 dark:border-orange-800/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className={`text-xs ${theme.text}`}>
                  <span className="font-medium">Important:</span> This is a required update due to
                  architectural improvements in the Vincent ecosystem.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-6">
          <button
            onClick={handleConnect}
            disabled={isRedirecting}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              ...fonts.heading,
              backgroundColor: isRedirecting ? theme.textMuted : theme.brandOrange,
              animation: isRedirecting ? 'none' : 'pulse 2s ease-in-out infinite',
            }}
            onMouseEnter={(e) => {
              if (!isRedirecting) {
                e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
              }
            }}
            onMouseLeave={(e) => {
              if (!isRedirecting) {
                e.currentTarget.style.backgroundColor = theme.brandOrange;
              }
            }}
          >
            {isRedirecting ? (
              'Redirecting...'
            ) : (
              <>
                <ArrowRight className="w-4 h-4 flex-shrink-0 -mt-px" />
                <span className="leading-none">Connect to Vincent Yield</span>
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
