import { Moon, Sun, LogOut, User, Copy, Home } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { AuthInfo, useClearAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { useNavigate } from 'react-router-dom';
import { ThemeType } from './theme';

interface ConsentPageHeaderProps {
  isDark: boolean;
  theme: ThemeType;
  onToggleTheme: () => void;
  authInfo: AuthInfo;
}

export function ConsentPageHeader({
  isDark,
  theme,
  onToggleTheme,
  authInfo,
}: ConsentPageHeaderProps) {
  const { clearAuthInfo } = useClearAuthInfo();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await clearAuthInfo();
    window.location.reload();
  };

  const handleDashboardClick = () => {
    navigate('/user/apps');
  };

  const handleCopyEthAddress = async () => {
    if (authInfo.agentPKP?.ethAddress) {
      try {
        await navigator.clipboard.writeText(authInfo.agentPKP.ethAddress);
      } catch (err) {
        console.error('Failed to copy eth address:', err);
      }
    }
  };

  const formatAuthInfo = () => {
    return `Sign-In Type: ${authInfo.type}\nAuthenticated: ${new Date(authInfo.authenticatedAt).toLocaleString()}${authInfo.userId ? `\nUser ID: ${authInfo.userId}` : ''}${authInfo.value ? `\nValue: ${authInfo.value}` : ''}`;
  };

  return (
    <div className={`px-6 py-4 border-b ${theme.cardBorder}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={isDark ? '/logo-white.svg' : '/logo.svg'}
            alt="Vincent by Lit Protocol"
            className="h-8"
          />
          <span className={`text-lg font-medium ${theme.text}`}>Connect with Vincent</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDashboardClick}
            className={`${theme.text} hover:bg-white/10`}
          >
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <div className="relative group">
            <Button variant="ghost" size="sm" className={`${theme.text} hover:bg-white/10`}>
              <User className="w-4 h-4" />
              <div className="text-white-300">My Account</div>
            </Button>
            <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-black text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-pre-line z-10 min-w-max">
              <div className="mb-2">{formatAuthInfo()}</div>
              {authInfo.agentPKP?.ethAddress && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
                  <div>
                    <div className="text-gray-300">Agent PKP:</div>
                    <div className="font-mono text-xs">{authInfo.agentPKP.ethAddress}</div>
                  </div>
                  <button
                    onClick={handleCopyEthAddress}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className={`${theme.text} hover:bg-white/10`}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTheme}
            className={`${theme.text} hover:bg-white/10`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
