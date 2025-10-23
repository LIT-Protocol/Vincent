import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { theme, fonts } from '../connect/ui/theme';
import { ExternalLink, Sparkles } from 'lucide-react';

interface VincentYieldModalProps {
  onClose: () => void;
}

export function VincentYieldModal({ onClose }: VincentYieldModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <style>{`
        button[class*="absolute top-4 right-4"] {
          opacity: 0.15 !important;
        }
        button[class*="absolute top-4 right-4"]:hover {
          opacity: 0.4 !important;
        }
      `}</style>
      <DialogContent
        className="w-[calc(100%-1rem)] max-w-md border-2 rounded-2xl shadow-2xl overflow-hidden p-0 backdrop-blur-xl"
        style={{
          borderColor: theme.brandOrange,
          background: `linear-gradient(135deg, ${theme.mainCard} 0%, rgba(224, 90, 26, 0.05) 100%)`,
        }}
      >
        {/* NEW badge */}
        <div
          className="absolute top-4 right-12 px-2 py-1 rounded-md text-xs font-bold tracking-wide z-10"
          style={{
            backgroundColor: theme.brandOrange,
            color: 'white',
            ...fonts.heading,
          }}
        >
          NEW
        </div>

        <DialogHeader className={`px-4 sm:px-6 pt-6 pb-4`}>
          {/* Logo and Title */}
          <div className="flex items-center gap-3 mb-4">
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
                className={`text-base font-semibold leading-tight ${theme.text}`}
                style={fonts.heading}
              >
                Vincent Yield
              </DialogTitle>
              <span className={`text-sm leading-tight`} style={{ color: theme.brandOrange }}>
                Earn on your USDC
              </span>
            </div>
          </div>

          <DialogDescription
            className={`${theme.textMuted} text-xs leading-relaxed`}
            style={fonts.body}
          >
            Vincent powers the next wave of user-owned finance and agent-driven automation for Web3.
            Deposit at least 50 USDC on Base Mainnet to get started.
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 sm:px-6 pb-6">
          <button
            onClick={() => {
              window.open('https://yield.heyvincent.ai', '_blank');
              onClose();
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-white"
            style={{
              ...fonts.heading,
              backgroundColor: theme.brandOrange,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.brandOrange;
            }}
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0 -mt-px" />
            <span className="leading-none">Visit Vincent Yield</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
