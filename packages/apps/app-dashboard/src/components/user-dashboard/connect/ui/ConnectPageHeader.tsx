import { useState } from 'react';
import { Moon, Sun, LogOut, User, Copy, Check } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/shared/ui/tooltip';
import { AuthInfo, useClearAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { theme } from './theme';
import { toggleTheme } from '@/lib/theme';
import { useTheme } from '@/hooks/useTheme';

interface ConnectPageHeaderProps {
  authInfo: AuthInfo;
}

export function ConnectPageHeader({ authInfo }: ConnectPageHeaderProps) {
  const isDark = useTheme();
  const { clearAuthInfo } = useClearAuthInfo();
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleSignOut = async () => {
    await clearAuthInfo();
    window.location.reload();
  };

  const handleCopyEthAddress = async () => {
    if (authInfo.userPKP?.ethAddress) {
      try {
        await navigator.clipboard.writeText(authInfo.userPKP.ethAddress);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy eth address:', err);
      }
    }
  };

  const formatAuthInfo = () => {
    return `Sign-In Type: ${authInfo.type}\nAuthenticated: ${new Date(authInfo.authenticatedAt).toLocaleString()}`;
  };

  return (
    <div className={`px-3 sm:px-6 py-3 border-b ${theme.cardBorder}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img
            src={isDark ? '/logo-white.svg' : '/logo.svg'}
            alt="Vincent by Lit Protocol"
            className="h-4 w-4 flex-shrink-0"
          />
          <span className={`text-sm font-medium ${theme.text} truncate mt-0.5`}>
            Vincent Connect
          </span>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`${theme.text} hover:bg-white/10 px-2 sm:px-3`}
                onClick={() => setIsTooltipOpen(!isTooltipOpen)}
              >
                <User className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="end"
              className={`max-w-64 p-3 ${theme.mainCard} border ${theme.mainCardBorder} ${theme.text} shadow-lg`}
            >
              <div className="space-y-2">
                <div className={`text-xs whitespace-pre-line break-words ${theme.text}`}>
                  {formatAuthInfo()}
                </div>
                {authInfo.userPKP?.ethAddress && (
                  <div className="flex items-start gap-2 pt-2 border-t border-gray-600">
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-500 dark:text-gray-300 text-xs">
                        Vincent Wallet Address:
                      </div>
                      <div className="font-mono text-xs break-all">
                        {authInfo.userPKP.ethAddress}
                      </div>
                    </div>
                    <button
                      onClick={handleCopyEthAddress}
                      className={`p-1 ${theme.itemHoverBg} rounded transition-colors flex-shrink-0 ${theme.text} ${
                        isCopied ? 'text-green-500' : ''
                      }`}
                    >
                      {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-600">
                  <button
                    onClick={handleSignOut}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs ${theme.text} ${theme.itemHoverBg} rounded transition-colors`}
                  >
                    <LogOut className="w-3 h-3" />
                    Sign out
                  </button>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className={`${theme.text} hover:bg-white/10 px-2 sm:px-3`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
