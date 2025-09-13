import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { theme } from './theme';

interface InfoBannerProps {
  type?: 'warning' | 'success' | 'orange' | 'blue' | 'red';
  title?: string;
  message?: string;
}

export function InfoBanner({
  type = 'warning',
  title = 'Permission Request',
  message = 'This application is requesting access to specific policies. Please review and configure the permissions below.',
}: InfoBannerProps) {
  const isSuccess = type === 'success';
  const isOrange = type === 'orange';
  const isBlue = type === 'blue';
  const isRed = type === 'red';
  const Icon = isRed
    ? XCircle
    : isSuccess || isOrange
      ? CheckCircle
      : isBlue
        ? Info
        : AlertTriangle;

  let bgClass, iconClass;
  if (isRed) {
    bgClass = 'bg-red-50 border-red-300 dark:bg-red-500/10 dark:border-red-500/30';
    iconClass = 'text-red-700 dark:text-red-400';
  } else if (isBlue) {
    bgClass = 'bg-blue-50 border-blue-300 dark:bg-blue-500/10 dark:border-blue-500/30';
    iconClass = 'text-blue-700 dark:text-blue-400';
  } else if (isOrange) {
    bgClass = 'bg-orange-50 border-orange-300 dark:bg-orange-500/10 dark:border-orange-500/30';
    iconClass = 'text-orange-700 dark:text-orange-400';
  } else if (isSuccess) {
    bgClass = theme.successBg;
    iconClass = theme.successText;
  } else {
    bgClass = theme.warningBg;
    iconClass = theme.warningText;
  }

  return (
    <div className={`rounded-lg p-3 border ${bgClass}`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${iconClass}`} />
        <div>
          <p className={`text-sm font-medium ${theme.text}`} style={{ fontSize: '13px' }}>
            {title}
          </p>
          <div className={`text-xs ${theme.textMuted} mt-0.5`}>{message}</div>
        </div>
      </div>
    </div>
  );
}
