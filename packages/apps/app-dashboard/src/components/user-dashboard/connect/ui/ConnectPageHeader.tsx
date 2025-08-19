import { useState } from 'react';
import { Moon, Sun, LogOut, User } from 'lucide-react';
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

  const handleSignOut = async () => {
    await clearAuthInfo();
    window.location.reload();
  };


  const formatAuthInfo = () => {
    return `Sign-In Type: ${authInfo.type}\nAuthenticated: ${new Date(authInfo.authenticatedAt).toLocaleString()}${authInfo.value ? `\nValue: ${authInfo.value}` : ''}`;
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
