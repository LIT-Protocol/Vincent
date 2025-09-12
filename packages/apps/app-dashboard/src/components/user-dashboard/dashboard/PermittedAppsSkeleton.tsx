import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { Card, CardContent } from '@/components/shared/ui/card';

export function PermittedAppsSkeleton() {
  // Generate 6 skeleton cards to fill the grid nicely
  const skeletonCards = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div className="w-full flex justify-center md:justify-start px-3 sm:px-6 pt-6">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 max-w-[1600px] place-items-center md:place-items-start">
        {skeletonCards.map((index) => (
          <Card
            key={index}
            className={`py-0 gap-0 backdrop-blur-xl ${theme.mainCard} border ${theme.cardBorder} transition-all duration-200 w-full max-w-sm`}
          >
            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                {/* Logo and Title Row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg ${theme.itemBg} animate-pulse`}></div>
                    <div>
                      <div className={`h-5 w-24 rounded ${theme.itemBg} animate-pulse mb-1`}></div>
                      <div className={`h-3 w-12 rounded ${theme.itemBg} animate-pulse`}></div>
                    </div>
                  </div>
                </div>

                {/* Vincent Wallet Address */}
                <div
                  className={`flex items-center justify-between p-2 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}
                >
                  <div className="flex flex-col">
                    <div className={`h-3 w-20 rounded ${theme.itemBg} animate-pulse mb-1`}></div>
                    <div className={`h-4 w-32 rounded ${theme.itemBg} animate-pulse`}></div>
                  </div>
                  <div className={`w-7 h-7 rounded ${theme.itemBg} animate-pulse`}></div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <div className="h-9 rounded-lg bg-orange-200 dark:bg-orange-800 animate-pulse"></div>
                  <div
                    className={`h-9 rounded-lg ${theme.itemBg} border ${theme.cardBorder} animate-pulse`}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
