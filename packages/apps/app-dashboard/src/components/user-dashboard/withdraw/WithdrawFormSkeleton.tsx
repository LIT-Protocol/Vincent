import { Skeleton } from '@/components/shared/ui/skeleton';
import { useTheme } from '@/providers/ThemeProvider';
import { theme } from '@/components/user-dashboard/consent/ui/theme';

export function WithdrawFormSkeleton() {
  const { isDark } = useTheme();
  const themeStyles = theme(isDark);

  return (
    <div
      className={`max-w-[550px] w-full mx-auto ${themeStyles.cardBg} rounded-xl shadow-lg border ${themeStyles.cardBorder} overflow-hidden`}
    >
      <div className={`px-6 pt-8 pb-6 border-b ${themeStyles.cardBorder}`}>
        <Skeleton className="h-6 w-20 mb-6" />

        <div className="mb-4">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="flex items-center justify-center mb-8 mt-6 px-8">
          <div className="pb-2 text-lg font-medium">
            <div className="flex items-center gap-2 px-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-6 w-8" />
            </div>
          </div>

          <span className={`mx-8 ${themeStyles.textMuted} pointer-events-none text-lg`}>|</span>

          <div className="px-4 pb-2 text-lg font-medium flex items-center gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-5" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Balance section skeleton */}
          <div className={`p-4 border rounded-lg ${themeStyles.itemBg}`}>
            <div className="flex justify-between items-center">
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-8 w-32 mt-1" />
              </div>
            </div>
            <div className="mt-3">
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Form fields skeleton */}
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Button skeleton */}
          <div className="pt-4">
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
