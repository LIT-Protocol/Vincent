import { theme } from './ui/theme';
import ConnectView, { AuthView } from './Connect';
import { App } from '@/types/developer-dashboard/appTypes';
import { ReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { ConnectAppHeader } from './ui/ConnectAppHeader';
import { ConnectPageHeader } from './ui/ConnectPageHeader';
import { useState } from 'react';

type AuthConnectScreenProps = {
  app: App;
  readAuthInfo: ReadAuthInfo;
};

export function AuthConnectScreen({ app, readAuthInfo }: AuthConnectScreenProps) {
  const [authView, setAuthView] = useState<AuthView>('default');

  return (
    <div
      className={`w-full max-w-md mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden relative z-10 origin-center`}
    >
      {/* Header */}
      <ConnectPageHeader authView={authView} onAuthViewChange={setAuthView} />

      <div className="px-3 sm:px-4 py-6 sm:py-8 space-y-6">
        {/* App Header */}
        <ConnectAppHeader app={app} />

        {/* Dividing line */}
        <div className={`border-b ${theme.cardBorder}`}></div>

        {/* Connect Methods */}
        <div className="w-full">
          <ConnectView
            theme={theme}
            readAuthInfo={readAuthInfo}
            view={authView}
            setView={setAuthView}
          />
        </div>
      </div>
    </div>
  );
}
