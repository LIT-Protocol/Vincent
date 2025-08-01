import { ReactElement, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { ThemeType } from './theme';

interface ActionCardProps {
  theme: ThemeType;
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
  theme,
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
  const isClickable = !isLoading && !disabled;

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
          <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-medium text-red-500`}>Error occurred</h3>
            <p className={`text-xs ${theme.textMuted}`}>{error}</p>
            <p className={`text-xs ${theme.textMuted} mt-1`}>Click to retry</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 ${iconBg} rounded-full flex items-center justify-center`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${theme.text}`}>{title}</h3>
            <p className={`text-xs ${theme.textMuted}`}>{description}</p>
          </div>
          {extraContent && <div className="flex items-center justify-center">{extraContent}</div>}
        </div>
      )}
    </div>
  );
}
