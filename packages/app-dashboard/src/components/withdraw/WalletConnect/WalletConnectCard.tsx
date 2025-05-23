import { ReactNode } from 'react';

interface WalletConnectCardProps {
  children: ReactNode;
  variant: 'sessions' | 'requests' | 'proposal';
  title: string;
  icon?: string;
  subtitle?: string;
  className?: string;
}

const variantStyles = {
  sessions: {
    gradient: 'bg-gradient-to-r from-blue-50 to-indigo-50',
    border: 'border-blue-100',
    text: 'text-blue-700',
    titleText: 'text-blue-900',
    titleBorder: 'border-blue-100',
  },
  requests: {
    gradient: 'bg-gradient-to-r from-orange-50 to-amber-50',
    border: 'border-orange-100',
    text: 'text-orange-800',
    titleText: 'text-orange-900',
    titleBorder: 'border-orange-100',
  },
  proposal: {
    gradient: 'bg-gradient-to-r from-yellow-50 to-amber-50',
    border: 'border-yellow-100',
    text: 'text-yellow-800',
    titleText: 'text-yellow-900',
    titleBorder: 'border-yellow-100',
  },
};

export function WalletConnectCard({
  children,
  variant,
  title,
  icon,
  subtitle,
  className = '',
}: WalletConnectCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={`w-full mt-4 p-3 ${styles.gradient} border ${styles.border} ${styles.text} text-sm rounded mb-3 shadow-sm ${className}`}
    >
      <div
        className={`font-semibold mb-3 ${styles.titleText} border-b ${styles.titleBorder} pb-2 flex items-center`}
      >
        {icon && (
          <span className="text-lg mr-2" role="img" aria-label={`${variant} icon`}>
            {icon}
          </span>
        )}
        {title}
        {subtitle && <span className="text-xs ml-2 font-normal">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}
