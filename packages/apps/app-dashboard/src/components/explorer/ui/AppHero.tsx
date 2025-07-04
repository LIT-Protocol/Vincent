import { Layers } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { App } from '@/types/developer-dashboard/appTypes';

export function AppHero({ apps }: { apps: App[] }) {
  const { theme } = useTheme();

  return (
    <div className="relative group">
      <div
        className={`absolute inset-0 ${theme.glowColor} rounded-2xl blur-xl group-hover:${theme.glowOpacity} transition-all duration-700`}
      ></div>
      <div
        className={`relative ${theme.cardBg} backdrop-blur-xl border ${theme.cardBorder} rounded-2xl p-12 ${theme.cardHoverBorder} transition-all duration-500`}
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <div className="mb-4">
              <span className={`text-sm font-medium ${theme.textSubtle} mb-2 block`}>
                Total Applications: {apps.length}
              </span>
            </div>
            <h1 className={`text-5xl sm:text-6xl font-light ${theme.text} mb-6 leading-tight`}>
              Delegate your
              <br />
              success
            </h1>
          </div>

          <div className="relative">
            <div
              className={`w-64 h-64 ${theme.glowColor} rounded-3xl transform rotate-12 hover:rotate-45 transition-all duration-1000 flex items-center justify-center backdrop-blur-sm border ${theme.cardBorder}`}
            >
              <div
                className={`w-48 h-48 ${theme.itemBg} rounded-2xl transform -rotate-12 hover:rotate-12 transition-all duration-700 flex items-center justify-center border ${theme.itemBorder}`}
              >
                <Layers
                  className={`w-16 h-16 ${theme.iconColor} transform hover:scale-110 transition-all duration-500`}
                />
              </div>
            </div>
            <div
              className={`absolute inset-0 w-64 h-64 ${theme.glowOpacity} rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
