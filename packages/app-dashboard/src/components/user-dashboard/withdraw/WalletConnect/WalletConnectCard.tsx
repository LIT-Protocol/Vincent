import { ReactNode } from 'react';

interface WalletConnectCardProps {
  children: ReactNode;
  variant: 'sessions' | 'requests' | 'proposal';
  title: string;
  icon?: ReactNode;
  subtitle?: string;
  className?: string;
}

const variantStyles = {
  sessions: {
    gradient: 'bg-white',
    border: 'border-gray-200',
    text: 'text-gray-800',
    titleText: 'text-gray-900',
    titleBorder: 'border-gray-200',
  },
  requests: {
    gradient: 'bg-white',
    border: 'border-gray-200',
    text: 'text-gray-800',
    titleText: 'text-gray-900',
    titleBorder: 'border-gray-200',
  },
  proposal: {
    gradient: 'bg-gradient-to-r from-purple-50 to-indigo-50',
    border: 'border-purple-100',
    text: 'text-purple-800',
    titleText: 'text-purple-900',
    titleBorder: 'border-purple-100',
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
        {icon && <span className="mr-2 flex items-center">{icon}</span>}
        {title}
        {subtitle && <span className="text-xs ml-2 font-normal">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}
