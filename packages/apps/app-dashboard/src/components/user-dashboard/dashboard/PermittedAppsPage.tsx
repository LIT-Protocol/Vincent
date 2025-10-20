import { App } from '@/types/developer-dashboard/appTypes';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { Package, ChevronDown, Check, Filter } from 'lucide-react';
import { AgentAppPermission } from '@/utils/user-dashboard/getAgentPkps';
import { PermittedAppCard } from './ui/PermittedAppCard';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';

type FilterState = 'permitted' | 'unpermitted' | 'all';

type PermittedAppsPageProps = {
  apps: App[];
  permittedPkps: AgentAppPermission[];
  unpermittedPkps: AgentAppPermission[];
  filterState: FilterState;
  setFilterState: (state: FilterState) => void;
};

export function PermittedAppsPage({
  apps,
  permittedPkps,
  unpermittedPkps,
  filterState,
  setFilterState,
}: PermittedAppsPageProps) {
  const isDark = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFilterLabel = () => {
    const labels = {
      permitted: 'Permitted',
      unpermitted: 'Unpermitted',
      all: 'All Apps',
    };
    return labels[filterState] || 'Permitted';
  };

  const getEmptyStateMessage = () => {
    const labels = {
      permitted: {
        title: 'No permitted applications',
        description:
          "You haven't granted permissions to any applications yet. Once you authorize apps, they'll appear here.",
      },
      unpermitted: {
        title: 'No unpermitted applications',
        description: 'All available applications have been granted permissions.',
      },
      all: {
        title: 'No applications found',
        description: 'There are no applications available at this time',
      },
    };
    return (
      labels[filterState] || {
        title: 'No permitted applications',
        description:
          "You haven't granted permissions to any applications yet. Once you authorize apps, they'll appear here.",
      }
    );
  };

  const emptyState = getEmptyStateMessage();

  return (
    <div className="w-full">
      {/* Filter Dropdown - Positioned in top right */}
      <div className="flex justify-end pb-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              showDropdown
                ? isDark
                  ? 'bg-white/10 border-white/20'
                  : 'bg-gray-900/5 border-gray-300'
                : isDark
                  ? 'hover:bg-white/5 border-white/10'
                  : 'hover:bg-gray-900/5 border-gray-200'
            } ${theme.text}`}
          >
            <Filter className="h-4 w-4" />
            {getFilterLabel()}
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
            />
          </button>

          {showDropdown && (
            <div
              className={`absolute right-0 top-full mt-2 min-w-[140px] rounded-lg shadow-lg border ${
                isDark ? 'bg-neutral-900 border-white/10' : 'bg-white border-gray-200'
              } z-50`}
            >
              <div className="p-1">
                <button
                  onClick={() => {
                    setFilterState('permitted');
                    setShowDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 h-10 rounded-md transition-all duration-200 ${
                    filterState === 'permitted'
                      ? `${theme.itemBg} text-orange-500`
                      : `${theme.text} ${theme.itemHoverBg}`
                  }`}
                >
                  <span className="text-sm font-medium">Permitted</span>
                  {filterState === 'permitted' && <Check className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => {
                    setFilterState('unpermitted');
                    setShowDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 h-10 rounded-md transition-all duration-200 ${
                    filterState === 'unpermitted'
                      ? `${theme.itemBg} text-orange-500`
                      : `${theme.text} ${theme.itemHoverBg}`
                  }`}
                >
                  <span className="text-sm font-medium">Unpermitted</span>
                  {filterState === 'unpermitted' && <Check className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => {
                    setFilterState('all');
                    setShowDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 h-10 rounded-md transition-all duration-200 ${
                    filterState === 'all'
                      ? `${theme.itemBg} text-orange-500`
                      : `${theme.text} ${theme.itemHoverBg}`
                  }`}
                >
                  <span className="text-sm font-medium">All Apps</span>
                  {filterState === 'all' && <Check className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px] w-full">
          <div className="text-center max-w-md mx-auto px-6">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${theme.itemBg} ${theme.cardBorder} border mb-6`}
            >
              <Package className={`w-8 h-8 ${theme.textMuted}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${theme.text}`}>{emptyState.title}</h3>
            <p className={`text-sm ${theme.textMuted} leading-relaxed`}>{emptyState.description}</p>
          </div>
        </div>
      ) : (
        <div className="w-full flex justify-center md:justify-start px-3 sm:px-6">
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 max-w-[1600px] place-items-center md:place-items-start">
            {apps.map((app, index) => {
              const permittedPermission = permittedPkps.find((p) => p.appId === app.appId);
              const unpermittedPermission = unpermittedPkps.find((p) => p.appId === app.appId);
              const permission = permittedPermission || unpermittedPermission;
              const isUnpermitted = !!unpermittedPermission && !permittedPermission;
              return (
                <PermittedAppCard
                  key={app.appId}
                  app={app}
                  permission={permission}
                  isUnpermitted={isUnpermitted}
                  index={index}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
