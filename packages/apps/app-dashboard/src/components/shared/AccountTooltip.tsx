import { useState, useEffect, useRef } from 'react';
import { User } from 'lucide-react';
import { fonts, theme as appTheme } from '@/lib/themeClasses';
import { useAuth } from '@/hooks/developer-dashboard/useAuth';
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
  const { authAddress, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Close tooltip when component mounts/remounts (like when sidebar opens)
  useEffect(() => {
    setIsOpen(false);
  }, []);

  // Close tooltip when clicking outside on mobile
  useEffect(() => {
    if (!isClient) return;

    const handleClickOutside = (event: MouseEvent): void => {
      if (window.innerWidth < 768 && isOpen) {
        // Check if click is outside the tooltip button AND the tooltip content
        const target = event.target as Element;
        const isOutsideButton = tooltipRef.current && !tooltipRef.current.contains(target);
        const isOutsideTooltip = !target.closest('[data-radix-popper-content-wrapper]');

        if (isOutsideButton && isOutsideTooltip) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }

    return undefined;
  }, [isOpen, isClient]);

  const formatAccountInfo = () => {
    if (!authAddress || !isClient) return '';
    const shortenedAddress = `${authAddress.slice(0, 6)}...${authAddress.slice(-4)}`;
    return `Authenticated Wallet\nAddress: ${shortenedAddress}`;
  };

  return (
    <div ref={tooltipRef}>
      <Tooltip
        open={isOpen}
        onOpenChange={(open): void => {
          // Only allow tooltip to open on desktop via hover, or mobile via click
          if (!isClient) return;
          if (window.innerWidth < 768) {
            // On mobile, only manual control
            return;
          }
          setIsOpen(open);
        }}
      >
        <TooltipTrigger asChild>
          <SidebarMenuButton
            className={`h-10 px-3 rounded-lg transition-all duration-200 ${theme.text} ${theme.itemHoverBg} md:cursor-default cursor-pointer`}
            style={fonts.heading}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              // Only toggle on mobile
              if (isClient && window.innerWidth < 768) {
                setIsOpen(!isOpen);
              }
            }}
          >
            <div className={theme.textMuted}>
              <User className="h-4 w-4" />
            </div>
            <span className={`font-medium ${theme.text}`}>My Account</span>
          </SidebarMenuButton>
        </TooltipTrigger>

        {isAuthenticated && authAddress && (
          <TooltipContent
            side="top"
            className={`${appTheme.mainCard} border ${appTheme.mainCardBorder} ${appTheme.text} max-w-sm shadow-lg`}
            style={{
              ...fonts.body,
              backgroundImage:
                'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px), radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            <div className="whitespace-pre-line text-xs">
              <div className="break-words">{formatAccountInfo()}</div>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
}
