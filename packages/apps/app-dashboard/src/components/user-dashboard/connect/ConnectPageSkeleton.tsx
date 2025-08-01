import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Card, CardContent } from '@/components/shared/ui/card';
import { theme } from './ui/theme';
import { useTheme } from '@/providers/ThemeProvider';

export function ConnectPageSkeleton() {
  const { isDark } = useTheme();
  const themeStyles = theme(isDark);

  return (
    <SkeletonTheme
      baseColor={isDark ? '#1f2937' : '#f3f4f6'}
      highlightColor={isDark ? '#374151' : '#e5e7eb'}
    >
      <div className={`min-h-screen w-full transition-colors duration-500 ${themeStyles.bg}`}>
        {/* Main Card Container */}
        <div
          className={`max-w-6xl mx-auto ${themeStyles.mainCard} border ${themeStyles.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden`}
        >
          {/* Header Skeleton */}
          <div className={`px-3 sm:px-6 py-4 border-b ${themeStyles.cardBorder}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Skeleton circle width={32} height={32} />
                <div className="flex-1 min-w-0">
                  <Skeleton height={20} className="max-w-[200px]" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton width={80} height={32} />
                <Skeleton width={80} height={32} />
                <Skeleton width={40} height={32} />
              </div>
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="px-3 sm:px-6 py-6 sm:py-8 space-y-6">
            {/* App Header Skeleton */}
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <Skeleton width={48} height={48} className="sm:w-16 sm:h-16" />
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <Skeleton height={24} className="max-w-[250px] mx-auto sm:mx-0" />
                  <Skeleton height={16} className="max-w-[300px] mx-auto sm:mx-0 mt-1" />
                </div>
              </div>
            </div>

            {/* Ability Accordion Skeleton */}
            <Card
              className={`backdrop-blur-xl ${themeStyles.cardBg} border ${themeStyles.cardBorder}`}
            >
              <CardContent className="p-0">
                {/* Ability Header */}
                <div className="p-3 sm:p-6 border-b border-gray-200/10">
                  <div className="flex items-center gap-3">
                    <Skeleton circle width={20} height={20} />
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Skeleton circle width={40} height={40} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Skeleton height={20} className="max-w-[200px]" />
                          <Skeleton circle width={16} height={16} />
                          <Skeleton circle width={16} height={16} />
                        </div>
                        <Skeleton height={14} className="max-w-[150px] mt-1" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Policy Content */}
                <div className="p-3 sm:p-6 pt-4">
                  <Skeleton height={16} className="max-w-[100px] mb-3" />
                  <Card className={`${themeStyles.itemBg} border ${themeStyles.cardBorder}`}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-3">
                        <Skeleton circle width={32} height={32} className="self-start" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Skeleton height={18} className="max-w-[150px]" />
                            <Skeleton circle width={16} height={16} />
                            <Skeleton circle width={16} height={16} />
                          </div>
                        </div>
                      </div>

                      {/* Description and Form - spans full width including under icon */}
                      <div className="mt-2">
                        <Skeleton height={14} className="max-w-full mb-3" />
                        <div className="space-y-2">
                          <Skeleton height={20} className="max-w-[120px]" />
                          <Skeleton height={36} className="max-w-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons Skeleton (includes trust warning) */}
            <div className="space-y-4">
              {/* Trust Warning Skeleton */}
              <div className="flex items-start gap-2 justify-center">
                <Skeleton circle width={16} height={16} className="mt-0.5" />
                <Skeleton height={14} className="max-w-[350px]" />
              </div>

              {/* Buttons Skeleton */}
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                <Skeleton height={40} className="w-full sm:w-[100px]" />
                <Skeleton height={40} className="w-full sm:w-[140px]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}
