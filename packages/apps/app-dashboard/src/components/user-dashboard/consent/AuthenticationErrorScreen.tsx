import { Card, CardContent } from '@/components/shared/ui/card';
import { Sun, Moon } from 'lucide-react';
import { theme } from './ui/theme';
import { InfoBanner } from './ui/InfoBanner';
import { Button } from '@/components/shared/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import ConsentView from './Consent';
import { useTheme } from '@/providers/ThemeProvider';

export function AuthenticationErrorScreen() {
  const { isDark, toggleTheme } = useTheme();
  const themeStyles = theme(isDark);

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${themeStyles.bg} p-4`}>
      {/* Main Card Container */}
      <div
        className={`max-w-6xl mx-auto ${themeStyles.mainCard} border ${themeStyles.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${themeStyles.cardBorder}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={isDark ? '/vincent-by-lit-white-logo.png' : '/vincent-by-lit-logo.png'}
                alt="Vincent by Lit Protocol"
                className="h-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className={`${themeStyles.text} hover:bg-white/10`}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-8 space-y-6">
          {/* Status Banner */}
          <InfoBanner
            theme={themeStyles}
            type="warning"
            title="Authentication Required"
            message="You need to authenticate to access this page. Please sign in to continue."
          />
          {/* Options Card */}
          <Card
            className={`backdrop-blur-xl ${themeStyles.cardBg} border ${themeStyles.cardBorder}`}
          >
            <CardContent className="p-6">
              <div className="space-y-3">
                {/* Sign In Option */}
                <div className="relative">
                  {/* ConsentView with smooth animation */}
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <ConsentView isUserDashboardFlow={false} theme={themeStyles} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
