import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Card, CardContent } from '@/components/shared/ui/card';
import { theme } from './ui/theme';
import { useTheme } from '@/providers/ThemeProvider';

export function ConsentPageSkeleton() {
  const { isDark } = useTheme();
  const themeStyles = theme(isDark);

  return (
    <SkeletonTheme
      baseColor={isDark ? '#1f2937' : '#f3f4f6'}
      highlightColor={isDark ? '#374151' : '#e5e7eb'}
    >
      <div className={`min-h-screen w-full transition-colors duration-500 ${themeStyles.bg} p-4`}>
        {/* Main Card Container */}
        <div
          className={`max-w-6xl mx-auto ${themeStyles.mainCard} border ${themeStyles.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden`}
        >
          {/* Header Skeleton */}
          <div className="px-6 py-4 border-b border-gray-200/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton circle width={40} height={40} />
                <div>
                  <Skeleton width={200} height={20} />
                  <Skeleton width={150} height={16} />
                </div>
              </div>
              <Skeleton width={100} height={36} />
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="px-6 py-8 space-y-6">
            {/* Banner Skeleton */}
            <Card className={`${themeStyles.cardBg} border ${themeStyles.cardBorder}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton circle width={32} height={32} />
                  <div className="flex-1">
                    <Skeleton width={300} height={16} />
                    <Skeleton width={400} height={14} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* App Header Skeleton */}
            <Card className={`${themeStyles.cardBg} border ${themeStyles.cardBorder}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton width={64} height={64} />
                  <div className="flex-1">
                    <Skeleton width={250} height={24} />
                    <Skeleton width={300} height={16} />
                    <Skeleton width={200} height={14} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Skeleton */}
            <Card className={`${themeStyles.cardBg} border ${themeStyles.cardBorder}`}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton width={200} height={20} />
                  <div className="space-y-3">
                    <Skeleton width="100%" height={16} />
                    <Skeleton width="90%" height={16} />
                    <Skeleton width="95%" height={16} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons Skeleton */}
            <div className="flex justify-end gap-3">
              <Skeleton width={100} height={40} />
              <Skeleton width={120} height={40} />
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}
