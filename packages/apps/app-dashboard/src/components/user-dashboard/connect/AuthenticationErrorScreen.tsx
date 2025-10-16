import { Sun, Moon, ArrowLeft } from 'lucide-react';
import { theme, fonts } from './ui/theme';
import { Button } from '@/components/shared/ui/button';
import { motion } from 'framer-motion';
import ConnectView, { AuthView } from './Connect';
import { Link, useNavigate } from 'react-router-dom';
import { ReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { toggleTheme } from '@/lib/theme';
import { useTheme } from '@/hooks/useTheme';
import { useState } from 'react';
import { Footer } from '@/components/shared/Footer';

type AuthenticationErrorScreenProps = {
  readAuthInfo: ReadAuthInfo;
  skipGlobeRender?: boolean; // If true, don't render grid/footer (parent is handling it)
};

export function AuthenticationErrorScreen({
  readAuthInfo,
  skipGlobeRender = false,
}: AuthenticationErrorScreenProps) {
  const isDark = useTheme();
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('default');

  const handleBackClick = () => {
    // If we're on a specific auth view, go back to the default view
    if (authView !== 'default') {
      setAuthView('default');
    } else {
      // If we're on the default view, navigate back to home with transition
      setIsTransitioning(true);
      setTimeout(() => {
        navigate('/');
      }, 500);
    }
  };

  // If skipGlobeRender is true, just render the card (parent is handling grid/footer)
  if (skipGlobeRender) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: !isTransitioning ? 1 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="pointer-events-auto w-full max-w-md px-4"
      >
        {/* Authentication Card */}
        <div
          className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden`}
        >
          {/* Header */}
          <div className={`px-3 sm:px-6 py-3 border-b ${theme.cardBorder}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackClick}
                  className={`${theme.text} hover:bg-white/10 w-8 h-8 p-0 flex-shrink-0`}
                  aria-label="Back to home"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Link to="/" className="flex items-center gap-3">
                  <img
                    src={isDark ? '/logo-white.svg' : '/logo.svg'}
                    alt="Vincent"
                    className="h-4 cursor-pointer hover:opacity-80 transition-opacity"
                  />
                  <span
                    className={`text-sm font-medium ${theme.text} mt-0.5`}
                    style={fonts.heading}
                  >
                    Vincent Connect
                  </span>
                </Link>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className={`${theme.text} hover:bg-white/10 w-8 h-8 p-0`}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="px-4 py-6">
            {/* Sign In Options */}
            <ConnectView
              theme={theme}
              readAuthInfo={readAuthInfo}
              view={authView}
              setView={setAuthView}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  // Otherwise, render the full grid layout with footer
  return (
    <>
      {/* Grid container with rows for main content and footer - matching RootPage structure */}
      <div
        className="grid grid-rows-[1fr_auto] min-h-screen bg-white dark:bg-gray-950 text-center overflow-x-hidden"
        style={{
          backgroundImage: isDark
            ? 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)'
            : 'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* Main content area - all layers in same grid cell */}
        <div className="relative row-start-1 col-start-1">
          {/* Globe is now rendered by parent GlobeLayout */}

          {/* Layer 2: Main Content (z-10) - Authentication Card */}
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: !isTransitioning ? 1 : 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="pointer-events-auto w-full max-w-md px-4"
            >
              {/* Authentication Card */}
              <div
                className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden`}
              >
                {/* Header */}
                <div className={`px-3 sm:px-6 py-3 border-b ${theme.cardBorder}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBackClick}
                        className={`${theme.text} hover:bg-white/10 w-8 h-8 p-0 flex-shrink-0`}
                        aria-label="Back to home"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Link to="/" className="flex items-center gap-3">
                        <img
                          src={isDark ? '/logo-white.svg' : '/logo.svg'}
                          alt="Vincent"
                          className="h-4 cursor-pointer hover:opacity-80 transition-opacity"
                        />
                        <span
                          className={`text-sm font-medium ${theme.text} mt-0.5`}
                          style={fonts.heading}
                        >
                          Vincent Connect
                        </span>
                      </Link>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleTheme}
                        className={`${theme.text} hover:bg-white/10 w-8 h-8 p-0`}
                      >
                        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-6">
                  {/* Sign In Options */}
                  <ConnectView
                    theme={theme}
                    readAuthInfo={readAuthInfo}
                    view={authView}
                    setView={setAuthView}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer in its own grid row (z-15) */}
        <div className="row-start-2 z-15 pb-1 sm:pb-3">
          <Footer />
        </div>
      </div>
    </>
  );
}
