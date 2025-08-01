import { User, Copy } from 'lucide-react';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { SidebarMenuButton } from '@/components/shared/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/shared/ui/tooltip';

interface AccountTooltipProps {
  theme: {
    text: string;
    textMuted: string;
    itemHoverBg: string;
    cardBg?: string;
    cardBorder?: string;
  };
}

export function AccountTooltip({ theme }: AccountTooltipProps) {
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
    return `Sign-In Type: ${authInfo.type}\nAuthenticated: ${new Date(authInfo.authenticatedAt).toLocaleString()}${authInfo.value ? `\nValue: ${authInfo.value}` : ''}`;
  };

  // Use theme-based colors or fallback to dark theme
  const tooltipClassName =
    theme.cardBg && theme.cardBorder
      ? `${theme.cardBg} ${theme.cardBorder} ${theme.text} max-w-sm`
      : 'bg-black text-white max-w-sm';

  const borderClassName = theme.cardBorder || 'border-gray-600';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <SidebarMenuButton
          className={`h-10 px-3 rounded-lg transition-all duration-200 ${theme.text} ${theme.itemHoverBg}`}
        >
          <User className="h-4 w-4" />
          <span className={`font-medium ${theme.text}`}>My Account</span>
        </SidebarMenuButton>
      </TooltipTrigger>

      {authInfo && (
        <TooltipContent side="top" className={tooltipClassName}>
          <div className="whitespace-pre-line text-xs">
            <div className="mb-2 break-words">{formatAuthInfo()}</div>
            {authInfo.agentPKP?.ethAddress && (
              <div className={`flex items-start gap-2 pt-2 border-t ${borderClassName}`}>
                <div className="flex-1 min-w-0">
                  <div className={theme.textMuted || 'text-gray-300'}>Agent PKP:</div>
                  <div className={`font-mono text-xs ${theme.text || 'text-white'} break-all`}>
                    {authInfo.agentPKP.ethAddress}
                  </div>
                </div>
                <button
                  onClick={handleCopyEthAddress}
                  className={`p-1 ${theme.itemHoverBg || 'hover:bg-gray-700'} rounded transition-colors flex-shrink-0`}
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
