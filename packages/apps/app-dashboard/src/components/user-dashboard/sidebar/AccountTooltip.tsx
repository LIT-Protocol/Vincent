import { User, Copy } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { theme } from '../consent/ui/theme';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/shared/ui/tooltip';
import { SidebarMenuButton } from '@/components/shared/ui/sidebar';

// Inline AccountTooltip component
export function AccountTooltip() {
  const { isDark } = useTheme();
  const themeStyles = theme(isDark);
  const { authInfo } = useReadAuthInfo();

  const handleCopyEthAddress = async () => {
    if (authInfo?.agentPKP?.ethAddress) {
      try {
        await navigator.clipboard.writeText(authInfo.agentPKP.ethAddress);
      } catch (err) {
        console.error('Failed to copy eth address:', err);
      }
    }
  };

  const formatAuthInfo = () => {
    if (!authInfo) return '';
    return `Sign-In Type: ${authInfo.type}\nAuthenticated: ${new Date(authInfo.authenticatedAt).toLocaleString()}${authInfo.userId ? `\nUser ID: ${authInfo.userId}` : ''}${authInfo.value ? `\nValue: ${authInfo.value}` : ''}`;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <SidebarMenuButton
          className={`h-10 px-3 rounded-lg transition-all duration-200 ${themeStyles.text} ${themeStyles.itemHoverBg}`}
        >
          <User className="h-4 w-4" />
          <span className={`font-medium ${themeStyles.text}`}>My Account</span>
        </SidebarMenuButton>
      </TooltipTrigger>

      {authInfo && (
        <TooltipContent
          side="top"
          className={`${isDark ? 'bg-black border-gray-700' : 'bg-white border-gray-200'} ${themeStyles.text} max-w-xs`}
        >
          <div className="whitespace-pre-line text-xs">
            <div className="mb-2">{formatAuthInfo()}</div>
            {authInfo.agentPKP?.ethAddress && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
                <div>
                  <div className={themeStyles.textMuted}>Agent PKP:</div>
                  <div className={`font-mono text-xs ${themeStyles.text}`}>
                    {authInfo.agentPKP.ethAddress}
                  </div>
                </div>
                <button
                  onClick={handleCopyEthAddress}
                  className={`p-1 ${themeStyles.itemHoverBg} rounded transition-colors`}
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </TooltipContent>
      )}
    </Tooltip>
  );
}
