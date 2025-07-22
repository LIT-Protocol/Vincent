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

type AuthConnectScreenProps = {
  app: App;
};

export function AuthConnectScreen({ app }: AuthConnectScreenProps) {
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
        <div className="px-6 py-8 space-y-6">
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
        <div className={`px-6 py-2 flex flex-col items-center gap-2 text-xs`}>
          <div className="flex items-center gap-1">
            <a
              href="https://t.me/+aa73FAF9Vp82ZjJh"
              target="_blank"
              rel="noopener noreferrer"
              className="!text-gray-400 hover:!text-gray-300 transition-colors"
            >
              Help
            </a>
            <span className="!text-gray-400"> / </span>
            <a
              href="https://www.litprotocol.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="!text-gray-400 hover:!text-gray-300 transition-colors"
            >
              Privacy
            </a>
            <span className="!text-gray-400"> / </span>
            <a
              href="https://www.litprotocol.com/legal/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="!text-gray-400 hover:!text-gray-300 transition-colors"
            >
              Terms
            </a>
          </div>
          <div className="flex items-center gap-2 !text-gray-400">
            <span>Powered by</span>
            <a
              href="https://litprotocol.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 !text-orange-500 hover:!text-orange-600 transition-colors"
            >
              <svg
                className="w-5 h-auto"
                width="40"
                viewBox="0 0 311 228"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Lit Protocol logo"
              >
                <path
                  d="M311 104.987V51.9125H256.038V29.2084L256.245 0.621826H202.816V174.264C202.816 181.242 204.193 188.153 206.866 194.599C209.54 201.045 213.459 206.9 218.398 211.83C223.337 216.76 229.2 220.667 235.652 223.328C242.103 225.989 249.016 227.352 255.994 227.338L311 227.25V175.045H269.794C267.969 175.047 266.162 174.689 264.477 173.992C262.791 173.295 261.259 172.272 259.969 170.982C258.679 169.692 257.656 168.16 256.959 166.474C256.262 164.789 255.904 162.982 255.906 161.157V140.517H256.053C256.053 128.723 256.053 116.929 256.053 104.943L311 104.987Z"
                  fill="currentColor"
                />
                <path
                  d="M142.841 51.9125H184.564V0.621826H131.489V227.442H184.564V93.9711C184.564 88.7506 182.208 83.8089 178.151 80.5223L142.841 51.9125Z"
                  fill="currentColor"
                />
                <path
                  d="M53.2347 161.157V0.621826H0.160156V174.264C0.160143 181.242 1.53637 188.153 4.21006 194.599C6.88376 201.045 10.8024 206.9 15.7418 211.83C20.6811 216.76 26.5442 220.667 32.9954 223.328C39.4466 225.989 46.3593 227.352 53.3379 227.338L113.12 227.25V175.045H67.1225C63.4392 175.045 59.9068 173.582 57.3023 170.978C54.6978 168.373 53.2347 164.841 53.2347 161.157Z"
                  fill="currentColor"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
