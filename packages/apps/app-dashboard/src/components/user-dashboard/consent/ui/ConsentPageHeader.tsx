import { useState, useEffect, useRef } from 'react';
import { Moon, Sun, LogOut, User, Copy } from 'lucide-react';
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
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsTooltipOpen(false);
      }
    };

    if (isTooltipOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTooltipOpen]);

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

  const toggleTooltip = () => {
    setIsTooltipOpen(!isTooltipOpen);
  };

  const formatAuthInfo = () => {
    return `Sign-In Type: ${authInfo.type}\nAuthenticated: ${new Date(authInfo.authenticatedAt).toLocaleString()}${authInfo.userId ? `\nUser ID: ${authInfo.userId}` : ''}${authInfo.value ? `\nValue: ${authInfo.value}` : ''}`;
  };

  return (
    <div className={`px-3 sm:px-6 py-4 border-b ${theme.cardBorder}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img
            src={isDark ? '/logo-white.svg' : '/logo.svg'}
            alt="Vincent by Lit Protocol"
            className="h-8 flex-shrink-0"
          />
          <span className={`text-lg font-medium ${theme.text} truncate`}>Connect with Vincent</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div className="relative" ref={tooltipRef}>
            <Button
              variant="ghost"
              size="sm"
              className={`${theme.text} hover:bg-white/10 px-2 sm:px-3`}
              onClick={toggleTooltip}
              onMouseEnter={() => setIsTooltipOpen(true)}
              onMouseLeave={() => setIsTooltipOpen(false)}
            >
              <User className="w-4 h-4" />
              <div className="hidden sm:block ml-2">My Account</div>
            </Button>
            {isTooltipOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 sm:w-auto px-3 py-2 bg-black text-white text-xs rounded-md whitespace-pre-line z-50 max-w-[calc(100vw-2rem)] sm:min-w-max">
                <div className="mb-2 break-words">{formatAuthInfo()}</div>
                {authInfo.agentPKP?.ethAddress && (
                  <div className="flex items-start gap-2 pt-2 border-t border-gray-600">
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-300">Agent PKP:</div>
                      <div className="font-mono text-xs break-all">
                        {authInfo.agentPKP.ethAddress}
                      </div>
                    </div>
                    <button
                      onClick={handleCopyEthAddress}
                      className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className={`${theme.text} hover:bg-white/10 px-2 sm:px-3`}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline ml-2">Sign out</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTheme}
            className={`${theme.text} hover:bg-white/10 px-2 sm:px-3`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
