import { AlertTriangle, CheckCircle } from 'lucide-react';
import { ThemeType } from './theme';

interface InfoBannerProps {
  theme: ThemeType;
  type?: 'warning' | 'success';
  title?: string;
  message?: string;
}

export function InfoBanner({
  theme,
  type = 'warning',
  title = 'Permission Request',
  message = 'This application is requesting access to specific policies. Please review and configure the permissions below.',
}: InfoBannerProps) {
  const isSuccess = type === 'success';
  const Icon = isSuccess ? CheckCircle : AlertTriangle;
  const bgClass = isSuccess ? theme.successBg : theme.warningBg;
  const iconClass = isSuccess ? theme.successText : theme.warningText;

  return (
    <div className={`rounded-lg p-4 border ${bgClass}`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${iconClass}`} />
        <div>
          <p className={`text-sm font-medium ${theme.text}`}>{title}</p>
          <p className={`text-xs ${theme.textMuted} mt-1`}>{message}</p>
        </div>
      </div>
    </div>
  );
}
