import { Logo } from '@/components/shared/ui/Logo';
import { App } from '@/types/developer-dashboard/appTypes';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

interface AppCardProps {
  app: App;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'deleted';
}

export function AppCard({ app, onClick, className = '', variant = 'default' }: AppCardProps) {
  if (variant === 'deleted') {
    return (
      <button
        onClick={onClick}
        className={`${theme.mainCard} border ${theme.mainCardBorder} border-dashed rounded-xl p-6 text-left opacity-60 hover:opacity-80 transition-opacity ${className}`}
      >
        <div className="flex items-start gap-3 mb-4">
          <Logo
            logo={app.logo}
            alt={`${app.name} logo`}
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0 grayscale"
          />
          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold ${theme.textMuted} truncate text-lg mb-1 line-through`}
              style={fonts.heading}
            >
              {app.name}
            </h3>
            <span
              className="text-xs px-2 py-1 rounded-md bg-red-500/10 text-red-500 dark:text-red-400"
              style={fonts.body}
            >
              DELETED
            </span>
          </div>
        </div>
        <p
          className={`text-sm ${theme.textSubtle} line-clamp-2 mb-3 line-through`}
          style={fonts.body}
        >
          {app.description}
        </p>
        <div className={`text-xs ${theme.textSubtle} font-mono`}>ID: {app.appId}</div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl p-6 text-left transition-all hover:shadow-lg ${className}`}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.brandOrange;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '';
      }}
    >
      <div className="flex items-start gap-3 mb-4">
        <Logo
          logo={app.logo}
          alt={`${app.name} logo`}
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${theme.text} truncate text-lg mb-1`} style={fonts.heading}>
            {app.name}
          </h3>
          <div className="flex gap-2 flex-wrap">
            {app.activeVersion && (
              <span className={`text-xs px-2 py-1 rounded-md ${theme.itemBg}`} style={fonts.body}>
                v{app.activeVersion}
              </span>
            )}
            <span
              className={`text-xs px-2 py-1 rounded-md ${theme.itemBg} uppercase`}
              style={fonts.body}
            >
              {app.deploymentStatus}
            </span>
          </div>
        </div>
      </div>
      <p className={`text-sm ${theme.textMuted} line-clamp-2 mb-3`} style={fonts.body}>
        {app.description}
      </p>
      <div className={`text-xs ${theme.textSubtle} font-mono`}>ID: {app.appId}</div>
    </button>
  );
}
