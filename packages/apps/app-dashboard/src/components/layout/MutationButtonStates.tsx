import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Reusable skeleton button component
export function SkeletonButton() {
  return (
    <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
      <Skeleton height={16} width={16} borderRadius={8} />
      <Skeleton height={16} width={80} borderRadius={4} />
    </SkeletonTheme>
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
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white">
            <div className="h-4 w-4 text-red-500">⚠</div>
            <span>{errorMessage}</span>
          </div>
        );

      case 'success':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-green-300 rounded-lg text-sm font-medium text-green-700 bg-white">
            <div className="h-4 w-4 text-green-500">✓</div>
            <span>{successMessage}</span>
          </div>
        );

      default:
        return <Skeleton height={height} width={width} />;
    }
  };

  return (
    <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
      <div className={className}>{skeletonContent()}</div>
    </SkeletonTheme>
  );
}
