import { motion } from 'framer-motion';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { Card, CardContent } from '@/components/shared/ui/card';
import { ExternalLink, Sparkles } from 'lucide-react';

type VincentYieldPromotionCardProps = {
  index?: number;
};

export function VincentYieldPromotionCard({ index = 0 }: VincentYieldPromotionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="w-full"
    >
      <Card
        className={`py-0 gap-0 backdrop-blur-xl border-2 transition-all duration-200 hover:shadow-lg w-full flex flex-col overflow-hidden relative`}
        style={{
          borderColor: theme.brandOrange,
          backgroundColor: `${theme.mainCard}`,
          backgroundImage: `linear-gradient(135deg, ${theme.mainCard} 0%, rgba(224, 90, 26, 0.05) 100%)`,
        }}
      >
        {/* Promotional badge */}
        <div
          className="absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-bold tracking-wide"
          style={{
            backgroundColor: theme.brandOrange,
            color: 'white',
            ...fonts.heading,
          }}
        >
          NEW
        </div>

        <CardContent className="p-4 flex flex-col gap-3">
          {/* Top section - Logo and Title */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: theme.brandOrange,
                }}
              >
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="flex flex-col justify-center min-w-0 flex-1">
                <h3
                  className={`text-base font-semibold leading-tight ${theme.text}`}
                  style={fonts.heading}
                >
                  Vincent Yield
                </h3>
                <span className={`text-sm leading-tight`} style={{ color: theme.brandOrange }}>
                  Earn on your USDC
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className={`text-xs ${theme.textMuted} leading-relaxed`} style={fonts.body}>
            Vincent powers the next wave of user-owned finance and agent-driven automation for Web3.
            Deposit at least 50 USDC on Base Mainnet to get started.
          </div>

          {/* Bottom section - Button */}
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => {
                window.open('https://yield.heyvincent.ai', '_blank');
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
        </CardContent>
      </Card>
    </motion.div>
  );
}
