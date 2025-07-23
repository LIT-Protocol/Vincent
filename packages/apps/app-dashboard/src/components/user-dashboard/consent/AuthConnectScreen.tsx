import { Card, CardContent } from '@/components/shared/ui/card';
import { Sun, Moon } from 'lucide-react';
import { theme } from './ui/theme';
import { Button } from '@/components/shared/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import ConsentView from './Consent';
import { useTheme } from '@/providers/ThemeProvider';
import { Link } from 'react-router-dom';
import { App } from '@/types/developer-dashboard/appTypes';
import { Logo } from '@/components/shared/ui/Logo';
import { ConsentFooter } from './ui/ConsentFooter';

type AuthConnectScreenProps = {
  app: App;
};

export function AuthConnectScreen({ app }: AuthConnectScreenProps) {
  const { isDark, toggleTheme } = useTheme();
  const themeStyles = theme(isDark);

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${themeStyles.bg} sm:p-4`}>
      {/* Main Card Container */}
      <div
        className={`max-w-6xl mx-auto ${themeStyles.mainCard} border ${themeStyles.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${themeStyles.cardBorder}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center">
                <img
                  src={isDark ? '/logo-white.svg' : '/logo.svg'}
                  alt="Vincent by Lit Protocol"
                  className="h-8 cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
              <span className={`text-lg font-medium ${themeStyles.text}`}>
                Connect with Vincent
              </span>
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
        <div className="px-3 sm:px-6 py-6 sm:py-8 space-y-6">
          {/* Options Card */}
          <Card
            className={`backdrop-blur-xl ${themeStyles.cardBg} border ${themeStyles.cardBorder}`}
          >
            <CardContent className="p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:gap-12 lg:items-start space-y-6 lg:space-y-0">
                  {/* App Info Section */}
                  <div className="lg:flex-none lg:w-80 space-y-6">
                    {/* App Logo */}
                    <div className="flex justify-center lg:justify-start">
                      <div
                        className={`p-3 rounded-xl ${themeStyles.iconBg} border ${themeStyles.iconBorder}`}
                      >
                        <Logo logo={app.logo} alt={app.name} className="w-16 h-16" />
                      </div>
                    </div>

                    {/* Sign in heading and app name */}
                    <div className="text-center lg:text-left space-y-2">
                      <h1 className={`text-2xl font-semibold ${themeStyles.text}`}>Sign in</h1>
                      <p className={`text-base ${themeStyles.text}`}>
                        to continue to{' '}
                        <button
                          onClick={() => window.open(app.appUserUrl, '_blank')}
                          className={`${themeStyles.linkColor || 'text-blue-600'} hover:underline cursor-pointer`}
                        >
                          {app.name}
                        </button>
                      </p>
                      {/* Dividing line */}
                      <div className={`border-b ${themeStyles.cardBorder} pt-4`}></div>
                    </div>
                  </div>

                  {/* ConsentView Section */}
                  <div className="flex-1 min-w-0">
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <ConsentFooter />
      </div>
    </div>
  );
}
