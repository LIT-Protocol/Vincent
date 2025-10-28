import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const statusClasses = {
  info: {
    container:
      'bg-blue-50 dark:!bg-blue-900/30 text-blue-700 dark:!text-blue-300 border border-blue-200 dark:!border-blue-700/30',
    icon: 'text-blue-700 dark:!text-blue-300',
  },
  warning: {
    container:
      'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700/30',
    icon: 'text-yellow-700 dark:text-yellow-300',
  },
  success: {
    container:
      'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
  },
  error: {
    container:
      'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
  },
};

const statusIcons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: AlertCircle,
};

export const StatusMessage = ({
  message,
  type = 'info',
  showIcon = true,
}: {
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error';
  showIcon?: boolean;
}) => {
  if (!message) return null;

  // Get the appropriate classes for the current status type
  const classes = statusClasses[type];
  const Icon = statusIcons[type];

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${classes.container}`}>
      {showIcon && <Icon className={`h-4 w-4 ${classes.icon} flex-shrink-0`} />}
      <span className="text-sm">{message}</span>
    </div>
  );
};
