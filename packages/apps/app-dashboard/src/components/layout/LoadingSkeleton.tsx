import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface LoadingSkeletonProps {
  type?: 'button' | 'card' | 'list' | 'form' | 'custom' | 'error' | 'success';
  count?: number;
  height?: number;
  width?: number | string;
  className?: string;
  children?: React.ReactNode;
  errorMessage?: string;
  successMessage?: string;
}

export default function LoadingSkeleton({
  type = 'custom',
  count = 1,
  height = 40,
  width = '100%',
  className = '',
  children,
  errorMessage = 'Error loading',
  successMessage = 'Success',
}: LoadingSkeletonProps) {
  const skeletonContent = () => {
    switch (type) {
      case 'button':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-400 bg-gray-50">
            <div className="animate-pulse bg-gray-300 rounded h-4 w-4"></div>
            <div className="animate-pulse bg-gray-300 rounded h-4 w-32"></div>
          </div>
        );
      
      case 'error':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-red-50">
            <div className="h-4 w-4 text-red-500">⚠</div>
            <span>{errorMessage}</span>
          </div>
        );
      
      case 'success':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-green-300 rounded-lg text-sm font-medium text-green-700 bg-green-50">
            <div className="h-4 w-4 text-green-500">✓</div>
            <span>{successMessage}</span>
          </div>
        );
      
      case 'card':
        return (
          <div className="space-y-4">
            <Skeleton height={24} width="60%" />
            <Skeleton height={16} width="80%" />
            <Skeleton height={16} width="40%" />
          </div>
        );
      
      case 'list':
        return (
          <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton height={40} width={40} />
                <div className="flex-1 space-y-2">
                  <Skeleton height={16} width="60%" />
                  <Skeleton height={12} width="40%" />
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'form':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton height={16} width="20%" />
              <Skeleton height={40} width="100%" />
            </div>
            <div className="space-y-2">
              <Skeleton height={16} width="30%" />
              <Skeleton height={40} width="100%" />
            </div>
            <div className="space-y-2">
              <Skeleton height={16} width="25%" />
              <Skeleton height={80} width="100%" />
            </div>
            <Skeleton height={40} width={120} />
          </div>
        );
      
      case 'custom':
        return children || <Skeleton height={height} width={width} count={count} />;
      
      default:
        return <Skeleton height={height} width={width} count={count} />;
    }
  };

  return (
    <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
      <div className={className}>
        {skeletonContent()}
      </div>
    </SkeletonTheme>
  );
} 