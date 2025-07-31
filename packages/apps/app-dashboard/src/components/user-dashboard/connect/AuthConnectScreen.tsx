import { Card, CardContent } from '@/components/shared/ui/card';
import { Sun, Moon } from 'lucide-react';
import { theme } from './ui/theme';
import { Button } from '@/components/shared/ui/button';
import ConnectView from './Connect';
import { App } from '@/types/developer-dashboard/appTypes';
import { Logo } from '@/components/shared/ui/Logo';
import { ConnectFooter } from '../ui/Footer';
import { UseReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { toggleTheme, isDarkMode } from '@/lib/theme';

type AuthConnectScreenProps = {
  app: App;
  readAuthInfo: UseReadAuthInfo;
};

export function AuthConnectScreen({ app, readAuthInfo }: AuthConnectScreenProps) {
  const isDark = isDarkMode();

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${theme.bg} sm:p-4`}>
      {/* Main Card Container */}
      <div
        className={`max-w-6xl mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden`}
      >
        {/* Header */}
        <div className={`px-6 py-3 border-b ${theme.cardBorder}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={isDark ? '/logo-white.svg' : '/logo.svg'}
                alt="Vincent by Lit Protocol"
                className="h-4 transition-opacity"
              />
              <span className={`text-sm font-medium ${theme.text}`}>Connect with Vincent</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className={`${theme.text} hover:bg-white/10`}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-3 sm:px-6 py-6 sm:py-8 space-y-6">
          {/* Options Card */}
          <Card className={`backdrop-blur-xl ${theme.cardBg} border ${theme.cardBorder}`}>
            <CardContent className="p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:gap-12 lg:items-start space-y-6 lg:space-y-0">
                  {/* App Info Section */}
                  <div className="lg:flex-none lg:w-80 space-y-6">
                    {/* App Logo */}
                    <div className="flex justify-center lg:justify-start">
                      <div className={`p-3 rounded-xl ${theme.iconBg} border ${theme.iconBorder}`}>
                        <Logo logo={app.logo} alt={app.name} className="w-16 h-16" />
                      </div>
                    </div>

                    {/* Sign in heading and app name */}
                    <div className="text-center lg:text-left space-y-2">
                      <h1 className={`text-2xl font-semibold ${theme.text}`}>Connect</h1>
                      <p className={`text-base ${theme.text}`}>
                        to continue to{' '}
                        <button
                          onClick={() => window.open(app.appUserUrl, '_blank')}
                          className={`${theme.linkColor || 'text-blue-600'} hover:underline cursor-pointer`}
                        >
                          {app.name}
                        </button>
                      </p>
                      {/* Dividing line */}
                      <div className={`border-b ${theme.cardBorder} pt-4`}></div>
                    </div>
                  </div>

                  {/* ConnectView Section */}
                  <div className="flex-1 min-w-0">
                    <ConnectView theme={theme} readAuthInfo={readAuthInfo} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <ConnectFooter />
      </div>
    </div>
  );
}
