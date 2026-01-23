import { App } from '@/types/developer-dashboard/appTypes';
import { ChevronDown, ChevronUp, Calendar, Clock } from 'lucide-react';
import { Logo } from '@/components/shared/ui/Logo';
import { theme, fonts } from '@/lib/themeClasses';
import { useState } from 'react';

export function AppHeader({ app }: { app: App }) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const getDisplayStatus = (status: string | undefined): string => {
    const normalizedStatus = status?.toLowerCase() || 'prod';
    switch (normalizedStatus) {
      case 'test':
        return 'BETA';
      case 'prod':
        return 'LIVE';
      default:
        return normalizedStatus.toUpperCase();
    }
  };

  // Check if description is long (more than 200 characters)
  const isDescriptionLong = app.description && app.description.length > 200;

  return (
    <div className="relative group">
      <div
        className={`relative bg-white dark:bg-gray-950 border ${theme.cardBorder} rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 ${theme.cardHoverBorder} transition-all duration-500`}
      >
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Logo */}
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg md:rounded-xl overflow-hidden ${theme.iconBg} border ${theme.iconBorder} flex items-center justify-center flex-shrink-0`}
          >
            <Logo logo={app.logo} alt={`${app.name} logo`} className="w-full h-full object-cover" />
          </div>

          {/* App Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
              <h1
                className={`text-2xl sm:text-3xl md:text-4xl font-light ${theme.text} tracking-tight break-words`}
                style={fonts.heading}
              >
                {app.name}
              </h1>
              <span
                className="inline-flex px-2.5 py-1 sm:px-3 rounded-full text-xs font-medium text-white w-fit"
                style={{ ...fonts.heading, backgroundColor: theme.brandOrange }}
              >
                {getDisplayStatus(app.deploymentStatus)}
              </span>
            </div>
            <div className="mb-4 sm:mb-6">
              <p
                className={`${theme.textMuted} text-sm sm:text-base leading-relaxed break-words overflow-wrap-anywhere ${!isDescriptionExpanded && isDescriptionLong ? 'line-clamp-3' : ''}`}
                style={{ ...fonts.body, wordBreak: 'break-word', overflowWrap: 'anywhere' }}
              >
                {app.description}
              </p>
              {isDescriptionLong && (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className={`mt-2 text-xs sm:text-sm font-medium flex items-center gap-1 ${theme.textMuted} hover:${theme.text} transition-colors duration-300`}
                  style={fonts.heading}
                >
                  {isDescriptionExpanded ? (
                    <>
                      Show less <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                    </>
                  ) : (
                    <>
                      Show more <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Created/Updated Dates */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5">
                <Calendar className={`w-3 h-3 sm:w-4 sm:h-4 ${theme.textMuted}`} />
                <span className={`text-xs sm:text-sm ${theme.textMuted}`} style={fonts.body}>
                  Created {new Date(app.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className={`w-3 h-3 sm:w-4 sm:h-4 ${theme.textMuted}`} />
                <span className={`text-xs sm:text-sm ${theme.textMuted}`} style={fonts.body}>
                  Updated {new Date(app.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
