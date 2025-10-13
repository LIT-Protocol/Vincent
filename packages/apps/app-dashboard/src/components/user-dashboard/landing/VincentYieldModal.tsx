import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { Button } from '@/components/shared/ui/button';
import { theme, fonts } from '../connect/ui/theme';
import { ExternalLink } from 'lucide-react';

interface VincentYieldModalProps {
  onClose: () => void;
}

export function VincentYieldModal({ onClose }: VincentYieldModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        button[class*="absolute top-4 right-4"] {
          opacity: 0.15 !important;
        }
        button[class*="absolute top-4 right-4"]:hover {
          opacity: 0.4 !important;
        }
      `}</style>
      <DialogContent
        className={`w-[calc(100%-1rem)] max-w-md mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden p-0`}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className={`px-3 sm:px-6 pt-4 pb-6 border-b ${theme.cardBorder}`}>
          <DialogTitle
            className={`text-lg font-semibold ${theme.text} text-center`}
            style={fonts.heading}
          >
            Welcome to Vincent
          </DialogTitle>
          <div
            className="text-xs uppercase tracking-widest font-medium text-center mt-1"
            style={{ ...fonts.heading, color: theme.brandOrange }}
          >
            EARLY ACCESS
          </div>
          <DialogDescription
            className={`${theme.textMuted} text-sm text-center mt-2`}
            style={fonts.body}
          >
            Vincent powers the next wave of user-owned finance and agent-driven automation for Web3.
            Deposit at least 50 USDC{' '}
            <span style={{ color: theme.brandOrange }}>on Base Mainnet</span> to get started with
            Vincent Yield.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center px-3 sm:px-6 pt-1 pb-4 sm:pb-6">
          <Button
            onClick={() => {
              window.open('https://yield.heyvincent.ai', '_blank');
              onClose();
            }}
            className="w-full tracking-wide transition-all duration-200 border text-white flex items-center justify-center gap-2 hover:bg-[#E03A04]"
            style={{
              ...fonts.heading,
              borderRadius: '0.5rem',
              fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
              padding: 'clamp(0.25rem, 1vw, 0.375rem) clamp(1rem, 4vw, 1.5rem)',
              backgroundColor: theme.brandOrange,
              borderColor: theme.brandOrange,
            }}
          >
            Visit Vincent Yield
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
