import { App } from '@/types/developer-dashboard/appTypes';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

export function AppHero({ apps }: { apps: App[] }) {
  return (
    <div className="relative group">
      <div
        className={`relative ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl p-12 ${theme.cardHoverBorder} transition-all duration-500`}
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-6">
            <div
              className={`inline-flex items-center gap-3 ${theme.itemBg} border ${theme.cardBorder} rounded-full px-4 py-2`}
            >
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: theme.brandOrange }}
              ></div>
              <span className={`text-sm font-semibold ${theme.text}`} style={fonts.heading}>
                {apps.length} {apps.length === 1 ? 'Application' : 'Applications'} Available
              </span>
            </div>
          </div>
          <h1
            className={`text-5xl sm:text-6xl font-light ${theme.text} mb-6 leading-tight`}
            style={fonts.heading}
          >
            Automate your
            <br />
            <span className="relative">
              Web3 interactions
              <div
                className={`absolute -bottom-2 left-0 right-0 h-1 rounded-full opacity-50`}
                style={{ backgroundColor: theme.brandOrange }}
              ></div>
            </span>
          </h1>
          <p className={`text-lg ${theme.textMuted} max-w-2xl leading-relaxed`} style={fonts.body}>
            Vincent applications work autonomously on your behalf, operating within the guidelines
            you set.
          </p>
        </div>
      </div>
    </div>
  );
}
