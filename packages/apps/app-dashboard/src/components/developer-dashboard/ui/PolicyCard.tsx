import { ReactNode } from 'react';
import { theme } from '@/components/user-dashboard/connect/ui/theme';

interface PolicyCardProps {
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'deleted';
}

export function PolicyCard({
  onClick,
  children,
  className = '',
  variant = 'default',
}: PolicyCardProps) {
  if (variant === 'deleted') {
    return (
      <button
        onClick={onClick}
        className={`${theme.mainCard} border ${theme.mainCardBorder} border-dashed rounded-xl p-6 text-left opacity-60 hover:opacity-80 transition-opacity ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl p-6 text-left transition-all hover:shadow-lg ${className}`}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.brandOrange;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '';
      }}
    >
      {children}
    </button>
  );
}
