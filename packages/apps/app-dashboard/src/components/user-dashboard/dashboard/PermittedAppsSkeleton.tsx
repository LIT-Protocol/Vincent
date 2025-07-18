import { useTheme } from '@/providers/ThemeProvider';
import { theme } from '../consent/ui/theme';
import { Card, CardContent } from '@/components/shared/ui/card';

export function PermittedAppsSkeleton() {
  const { isDark } = useTheme();
  const themeStyles = theme(isDark);

  // Generate 6 skeleton cards to fill the grid nicely
  const skeletonCards = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div className="w-full flex justify-start pl-6">
      <div className="w-full" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        columnGap: '1.5rem',
        rowGap: '1.5rem',
        alignItems: 'start'
      }}>
        {skeletonCards.map((index) => (
          <Card
            key={index}
            className={`py-0 gap-0 backdrop-blur-xl ${themeStyles.cardBg} border ${themeStyles.cardBorder}`}
            style={{ height: 'fit-content' }}
          >
            <CardContent className="p-3">
              <div className="flex flex-col gap-2">
                {/* Logo and Title Row */}
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-lg ${themeStyles.itemBg} animate-pulse`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`h-4 rounded ${themeStyles.itemBg} animate-pulse`}></div>
                  </div>
                  <div className={`w-4 h-4 rounded ${themeStyles.itemBg} animate-pulse`}></div>
                </div>
                
                {/* Description */}
                <div className="space-y-2">
                  <div className={`h-3 rounded ${themeStyles.itemBg} animate-pulse`}></div>
                  <div className={`h-3 rounded ${themeStyles.itemBg} animate-pulse w-3/4`}></div>
                </div>
                
                {/* App ID and Version */}
                <div className="flex items-center justify-between">
                  <div className={`h-3 w-16 rounded ${themeStyles.itemBg} animate-pulse`}></div>
                  <div className={`h-5 w-8 rounded ${themeStyles.itemBg} animate-pulse`}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 