import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { theme } from './theme';

interface StatusCardProps {
  isLoading?: boolean;
  loadingStatus?: string | null;
  error?: string | null;
  success?: string | null;
}

export function StatusCard({ isLoading, loadingStatus, error, success }: StatusCardProps) {
  if (!isLoading && !error && !success) {
    return null;
  }

  let icon, bgClass, iconClass, title, message;

  if (error) {
    icon = AlertCircle;
    bgClass = 'bg-red-50/50 border-red-200/50';
    iconClass = 'text-red-500';
    title = 'Error';
    message = error;
  } else if (success) {
    icon = CheckCircle;
    bgClass = theme.successBg;
    iconClass = theme.successText;
    title = 'Success';
    message = success;
  } else if (isLoading) {
    icon = Loader2;
    bgClass = 'bg-blue-50/50 border-blue-200/50';
    iconClass = 'text-blue-500';
    title = 'Processing';
    message = loadingStatus || 'Please wait...';
  }

  const Icon = icon!;

  return (
    <div className={`rounded-lg p-4 border ${bgClass}`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${iconClass} ${isLoading && !success ? 'animate-spin' : ''}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${theme.text}`}>{title}</p>
          <p className={`text-xs ${theme.textMuted} mt-1 truncate`}>{message}</p>
        </div>
      </div>
    </div>
  );
}
