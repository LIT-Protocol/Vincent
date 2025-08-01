import { User, Copy } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { theme } from '../connect/ui/theme';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { SidebarMenuButton } from '@/components/shared/ui/sidebar';

// Inline AccountTooltip component
export function AccountTooltip() {
  const { isDark } = useTheme();
  const themeStyles = theme(isDark);
  const { authInfo } = useReadAuthInfo();
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

  const handleCopyEthAddress = async () => {
    if (authInfo?.agentPKP?.ethAddress) {
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
    if (!authInfo) return '';
    return `Sign-In Type: ${authInfo.type}\nAuthenticated: ${new Date(authInfo.authenticatedAt).toLocaleString()}${authInfo.value ? `\nValue: ${authInfo.value}` : ''}`;
  };

  return (
    <div className="relative" ref={tooltipRef}>
      <SidebarMenuButton
        className={`h-10 px-3 rounded-lg transition-all duration-200 ${themeStyles.text} ${themeStyles.itemHoverBg}`}
        onClick={toggleTooltip}
        onMouseEnter={() => setIsTooltipOpen(true)}
        onMouseLeave={() => setIsTooltipOpen(false)}
      >
        <User className="h-4 w-4" />
        <span className={`font-medium ${themeStyles.text}`}>My Account</span>
      </SidebarMenuButton>
      {isTooltipOpen && authInfo && (
        <div className="absolute left-0 top-full mt-2 w-64 sm:w-auto px-3 py-2 bg-black text-white text-xs rounded-md whitespace-pre-line z-50 max-w-[calc(100vw-2rem)] sm:min-w-max">
          <div className="mb-2 break-words">{formatAuthInfo()}</div>
          {authInfo.agentPKP?.ethAddress && (
            <div className="flex items-start gap-2 pt-2 border-t border-gray-600">
              <div className="flex-1 min-w-0">
                <div className="text-gray-300">Agent PKP:</div>
                <div className="font-mono text-xs break-all">{authInfo.agentPKP.ethAddress}</div>
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
  );
}
