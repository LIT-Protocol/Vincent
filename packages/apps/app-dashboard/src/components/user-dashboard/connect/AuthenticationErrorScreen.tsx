import { Sun, Moon } from 'lucide-react';
import { theme } from './ui/theme';
import { InfoBanner } from './ui/InfoBanner';
import { Button } from '@/components/shared/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import ConnectView from './Connect';
import { Link } from 'react-router-dom';
import { ReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { ConnectFooter } from '../ui/Footer';
import { toggleTheme } from '@/lib/theme';
import { useTheme } from '@/hooks/useTheme';

type AuthenticationErrorScreenProps = {
  readAuthInfo: ReadAuthInfo;
};

export function AuthenticationErrorScreen({ readAuthInfo }: AuthenticationErrorScreenProps) {
  const isDark = useTheme();

  return (
    <div className="min-h-screen w-full transition-colors duration-500 p-2 sm:p-4 md:p-6 relative flex justify-center items-start pt-24 sm:pt-28 md:pt-32 lg:pt-40 overflow-hidden">
      {/* Left SVG - positioned from left */}
      <div
        className="absolute top-0 left-0 w-[600px] h-[600px] z-0"
        style={{
          backgroundImage: `url('/connect-static-left.svg')`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
        }}
      ></div>

      {/* Right SVG - positioned from right */}
      <div
        className="absolute top-0 z-0"
        style={{
          left: 'max(600px, calc(100vw - 600px))',
          width: '600px',
          height: '600px',
          backgroundImage: `url('/connect-static-right.svg')`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
        }}
      ></div>

      <div
        className={`max-w-md mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden relative z-10 origin-center`}
      >
        {/* Header */}
        <div className={`px-3 sm:px-6 py-3 border-b ${theme.cardBorder}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Link to="/" className="flex items-center gap-3">
                <img
                  src={isDark ? '/logo-white.svg' : '/logo.svg'}
                  alt="Vincent"
                  className="h-4 cursor-pointer hover:opacity-80 transition-opacity"
                />
                <span className={`text-sm font-medium ${theme.text} mt-0.5`}>Vincent Connect</span>
              </Link>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className={`${theme.text} hover:bg-white/10 w-8 h-8 p-0`}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-4 py-6 sm:py-8 space-y-6">
          {/* Status Banner */}
          <InfoBanner
            type="warning"
            title="Authentication Required"
            message="You need to authenticate to access this page. Please sign in."
          />

          {/* Dividing line */}
          <div className={`border-b ${theme.cardBorder}`}></div>

          {/* Sign In Options */}
          <div className="space-y-3">
            <div className="relative p-1 -m-1">
              {/* ConnectView with smooth animation */}
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-visible"
                >
                  <ConnectView theme={theme} readAuthInfo={readAuthInfo} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer */}
        <ConnectFooter />
      </div>
    </div>
  );
}
