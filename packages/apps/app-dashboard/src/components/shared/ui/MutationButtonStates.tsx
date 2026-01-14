import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { theme, fonts } from '@/lib/themeClasses';
import { CheckCircle, AlertCircle } from 'lucide-react';

// Reusable skeleton button component
export function SkeletonButton() {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-neutral-800">
      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
    </div>
  );
}

interface MutationButtonStatesProps {
  type?: 'error' | 'success';
  height?: number;
  width?: number | string;
  className?: string;
  errorMessage?: string;
  successMessage?: string;
}

export default function MutationButtonStates({
  type = 'error',
  height = 40,
  width = '100%',
  className = '',
  errorMessage = 'Error loading',
  successMessage = 'Success',
}: MutationButtonStatesProps) {
  const skeletonContent = () => {
    switch (type) {
      case 'error':
        return (
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg ${theme.mainCard} ${theme.mainCardBorder}`}
            style={{ borderColor: 'rgb(254 202 202 / 0.5)' }}
          >
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-600 dark:text-red-400" style={fonts.body}>
              {errorMessage}
            </span>
          </div>
        );

      case 'success':
        return (
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg ${theme.mainCard} ${theme.mainCardBorder}`}
            style={{ borderColor: theme.brandOrange }}
          >
            <CheckCircle className="h-4 w-4" style={{ color: theme.brandOrange }} />
            <span className={`text-sm ${theme.text}`} style={fonts.body}>
              {successMessage}
            </span>
          </div>
        );

      default:
        return <Skeleton height={height} width={width} />;
    }
  };

  return <div className={className}>{skeletonContent()}</div>;
}
