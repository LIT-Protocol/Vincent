import { theme } from './ui/theme';
import ConnectView from './Connect';
import { App } from '@/types/developer-dashboard/appTypes';
import { ConnectFooter } from '../ui/Footer';
import { ReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { ConnectAppHeader } from './ui/ConnectAppHeader';
import { useTheme } from '@/hooks/useTheme';

type AuthConnectScreenProps = {
  app: App;
  readAuthInfo: ReadAuthInfo;
};

export function AuthConnectScreen({ app, readAuthInfo }: AuthConnectScreenProps) {
  const isDark = useTheme();

  return (
    <div
      className={`w-full max-w-md mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden relative z-10 origin-center`}
    >
      {/* Header */}
      <div className={`px-3 sm:px-6 py-3 border-b ${theme.cardBorder}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={isDark ? '/logo-white.svg' : '/logo.svg'}
              alt="Vincent by Lit Protocol"
              className="h-4 w-4 transition-opacity"
            />
            <span className={`text-sm font-medium ${theme.text} mt-0.5`}>Vincent Connect</span>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 py-6 sm:py-8 space-y-6">
        {/* App Header */}
        <ConnectAppHeader app={app} />

        {/* Dividing line */}
        <div className={`border-b ${theme.cardBorder}`}></div>

        {/* Connect Methods */}
        <div className="w-full">
          <ConnectView theme={theme} readAuthInfo={readAuthInfo} />
        </div>
      </div>

      {/* Footer */}
      <ConnectFooter />
    </div>
  );
}
