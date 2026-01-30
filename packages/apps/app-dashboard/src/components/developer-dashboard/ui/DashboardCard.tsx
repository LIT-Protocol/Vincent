import { ReactNode } from 'react';
import { theme } from '@/lib/themeClasses';

interface DashboardCardProps {
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  borderColor?: string;
  hoverBorderColor?: string;
}

export function DashboardCard({
  onClick,
  children,
  className = '',
  disabled = false,
  borderColor,
  hoverBorderColor = theme.brandOrange,
}: DashboardCardProps) {
  const baseClasses = borderColor
    ? `${theme.itemBg} border rounded-lg p-4 text-left transition-all hover:shadow-md group`
    : `${theme.mainCard} border ${theme.mainCardBorder} rounded-xl p-6 text-left transition-all hover:shadow-lg`;

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${disabledClasses} ${className}`}
      style={
        {
          '--hover-border-color': hoverBorderColor,
          ...(borderColor && { borderColor }),
        } as React.CSSProperties
      }
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = hoverBorderColor;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = borderColor || '';
        }
      }}
    >
      {children}
    </button>
  );
}
