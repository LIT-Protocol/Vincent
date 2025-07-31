import { ReactElement, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { theme } from './theme';

interface ActionCardProps {
  icon: ReactElement;
  iconBg?: string;
  title: string;
  description: string;
  onClick: () => void;
  isLoading?: boolean;
  loadingStatus?: string | null;
  error?: string | null;
  disabled?: boolean;
  extraContent?: ReactNode;
}

export function ActionCard({
  icon,
  iconBg = 'bg-gray-500/20',
  title,
  description,
  onClick,
  isLoading = false,
  loadingStatus = null,
  error = null,
  disabled = false,
  extraContent,
}: ActionCardProps) {
  const isClickable = !disabled && !isLoading;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`p-4 rounded-lg border ${theme.cardBorder} ${theme.itemBg} ${
        isLoading ? 'opacity-75' : isClickable ? `${theme.itemHoverBg} cursor-pointer` : ''
      } transition-colors`}
    >
      {isLoading ? (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${theme.text}`}>{loadingStatus || 'Loading...'}</h3>
            <p className={`text-xs ${theme.textMuted}`}>
              Please wait while we process your request
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-red-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${theme.text}`}>Error</h3>
            <p className={`text-xs text-red-500`}>{error}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 flex items-center justify-center ${iconBg} rounded-lg`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${theme.text}`}>{title}</h3>
            <p className={`text-xs ${theme.textMuted}`}>{description}</p>
            {extraContent}
          </div>
        </div>
      )}
    </div>
  );
}
