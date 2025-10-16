import { useTheme } from '@/hooks/useTheme';
import { toggleTheme } from '@/lib/theme';
import { useCallback, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

interface ExplorerNavProps {
  onNavigate?: (path: string) => void;
  sidebarTrigger?: React.ReactNode;
}

export function ExplorerNav({ onNavigate, sidebarTrigger }: ExplorerNavProps) {
  const isDarkMode = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleDarkMode = useCallback(() => {
    toggleTheme();
  }, []);

  const handleNavigation = useCallback(
    (path: string) => {
      if (onNavigate) {
        onNavigate(path);
      }
      setIsMobileMenuOpen(false); // Close mobile menu after navigation
    },
    [onNavigate],
  );

  const isExplorer = location.pathname.startsWith('/explorer');
  const isDeveloper = location.pathname.startsWith('/developer');
  const isUser = location.pathname.startsWith('/user');

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10 pointer-events-auto">
      <div className="px-6 sm:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Left side: Sidebar trigger (mobile only), Logo and main nav links */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Sidebar trigger for mobile */}
            {sidebarTrigger && (
              <div className="md:hidden flex items-center relative" style={{ paddingTop: '10px' }}>
                {sidebarTrigger}
              </div>
            )}
            {/* Logo */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNavigation('/');
              }}
              className="hover:opacity-80 transition-opacity flex items-center"
            >
              <img
                src={isDarkMode ? '/vincent-main-logo-white.png' : '/vincent-main-logo.png'}
                alt="Vincent"
                className="h-7 md:h-8 pointer-events-none"
                style={{ aspectRatio: '2051/549' }}
              />
            </button>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1" style={{ paddingTop: '10px' }}>
              <button
                onClick={() => handleNavigation('/user/apps')}
                className="px-3 py-1.5 rounded-lg text-sm transition-colors no-underline hover:bg-gray-100 dark:hover:bg-gray-800 leading-none"
                style={{
                  ...fonts.heading,
                  color: isUser ? theme.brandOrange : undefined,
                }}
              >
                User
              </button>
              <button
                onClick={() => handleNavigation('/developer/dashboard')}
                className="px-3 py-1.5 rounded-lg text-sm transition-colors no-underline hover:bg-gray-100 dark:hover:bg-gray-800 leading-none"
                style={{
                  ...fonts.heading,
                  color: isDeveloper ? theme.brandOrange : undefined,
                }}
              >
                Developer
              </button>
              <button
                onClick={() => handleNavigation('/explorer/apps')}
                className="px-3 py-1.5 rounded-lg text-sm transition-colors no-underline hover:bg-gray-100 dark:hover:bg-gray-800 leading-none"
                style={{
                  ...fonts.heading,
                  color: isExplorer ? theme.brandOrange : undefined,
                }}
              >
                Explorer
              </button>
            </div>
          </div>

          {/* Right side: Utility links and mobile menu */}
          <div className="flex items-center gap-1 md:gap-2" style={{ paddingTop: '10px' }}>
            {/* Desktop utility links */}
            <div className="hidden md:flex items-center gap-1 md:gap-2">
              <a
                href="https://t.me/+aa73FAF9Vp82ZjJh"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm transition-colors no-underline !text-gray-900 dark:!text-white hover:bg-gray-100 dark:hover:bg-gray-800 whitespace-nowrap leading-none"
                style={fonts.heading}
              >
                Contact Us
              </a>
              <a
                href="https://docs.heyvincent.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm transition-colors no-underline !text-gray-900 dark:!text-white hover:bg-gray-100 dark:hover:bg-gray-800 whitespace-nowrap leading-none"
                style={fonts.heading}
              >
                Docs
              </a>
              <a
                href="https://spark.litprotocol.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm transition-colors no-underline !text-gray-900 dark:!text-white hover:bg-gray-100 dark:hover:bg-gray-800 whitespace-nowrap leading-none"
                style={fonts.heading}
              >
                Blog
              </a>
              <button
                onClick={toggleDarkMode}
                className="px-2 py-1.5 md:px-2 md:py-1.5 rounded-lg transition-colors !text-gray-900 dark:!text-white hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center leading-none -mt-0.5"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <svg className="w-4 h-4 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Mobile menu button and dark mode */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg transition-colors !text-gray-900 dark:!text-white hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg transition-colors !text-gray-900 dark:!text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden pt-4 pb-3 border-t border-gray-200 dark:border-white/10 mt-3">
            <div className="grid grid-cols-2 gap-6">
              {/* Navigation Section */}
              <div className="flex flex-col gap-2">
                <h3
                  className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  style={fonts.heading}
                >
                  Navigate
                </h3>
                <button
                  onClick={() => handleNavigation('/user/apps')}
                  className="px-3 py-2 rounded-lg text-sm transition-colors text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                  style={{
                    ...fonts.heading,
                    color: isUser ? theme.brandOrange : undefined,
                  }}
                >
                  User
                </button>
                <button
                  onClick={() => handleNavigation('/developer/dashboard')}
                  className="px-3 py-2 rounded-lg text-sm transition-colors text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                  style={{
                    ...fonts.heading,
                    color: isDeveloper ? theme.brandOrange : undefined,
                  }}
                >
                  Developer
                </button>
                <button
                  onClick={() => handleNavigation('/explorer/apps')}
                  className="px-3 py-2 rounded-lg text-sm transition-colors text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                  style={{
                    ...fonts.heading,
                    color: isExplorer ? theme.brandOrange : undefined,
                  }}
                >
                  Explorer
                </button>
              </div>

              {/* Divider */}
              <div className="absolute left-1/2 top-4 bottom-3 w-px bg-gray-200 dark:bg-white/10 transform -translate-x-1/2" />

              {/* Resources Section */}
              <div className="flex flex-col gap-2">
                <h3
                  className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  style={fonts.heading}
                >
                  Resources
                </h3>
                <a
                  href="https://t.me/+aa73FAF9Vp82ZjJh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg text-sm transition-colors text-left no-underline !text-gray-900 dark:!text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  style={fonts.heading}
                >
                  Contact Us
                </a>
                <a
                  href="https://docs.heyvincent.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg text-sm transition-colors text-left no-underline !text-gray-900 dark:!text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  style={fonts.heading}
                >
                  Docs
                </a>
                <a
                  href="https://spark.litprotocol.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg text-sm transition-colors text-left no-underline !text-gray-900 dark:!text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  style={fonts.heading}
                >
                  Blog
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
