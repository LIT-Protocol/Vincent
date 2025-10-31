import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { App, AppVersion } from '@/types/developer-dashboard/appTypes';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { Package, ChevronDown, Check, Filter } from 'lucide-react';
import { AgentAppPermission } from '@/utils/user-dashboard/getAgentPkps';
import { PermittedAppCard } from './ui/PermittedAppCard';

type FilterState = 'permitted' | 'unpermitted' | 'deleted' | 'all';

type PermittedAppsPageProps = {
  apps: App[];
  permittedPkps: AgentAppPermission[];
  unpermittedPkps: AgentAppPermission[];
  filterState: FilterState;
  setFilterState: (state: FilterState) => void;
  appVersionsMap: Record<string, AppVersion[]>;
};

export function PermittedAppsPage({
  apps,
  appVersionsMap,
  permittedPkps,
  unpermittedPkps,
  filterState,
  setFilterState,
}: PermittedAppsPageProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fade in content after mount
    setShowContent(true);
  }, []);

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
      deleted: 'Deleted',
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
      deleted: {
        title: 'No deleted applications',
        description: 'You have no permissions for deleted applications.',
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: showContent ? 1 : 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="w-full relative z-10"
    >
      {/* Flex container for content and sidebar */}
      <div className="flex gap-6 items-start">
        {/* Main content area */}
        <div className="flex-1 min-w-0">
          {/* Filter dropdown - shown on all screen sizes */}
          <div className="w-full mb-4 flex justify-end">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${theme.mainCardBorder} ${theme.mainCard} ${theme.itemHoverBg}`}
                style={fonts.heading}
              >
                <Filter className="h-4 w-4" />
                {getFilterLabel()}
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                />
              </button>

              {showDropdown && (
                <div
                  className={`absolute right-0 top-full mt-2 min-w-[140px] rounded-lg shadow-lg border ${theme.mainCardBorder} ${theme.mainCard} z-50`}
                >
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setFilterState('permitted');
                        setShowDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-3 h-10 rounded-md text-sm font-medium transition-all duration-200 ${
                        filterState === 'permitted'
                          ? 'text-white'
                          : `${theme.text} ${theme.itemHoverBg}`
                      }`}
                      style={
                        filterState === 'permitted'
                          ? { ...fonts.heading, backgroundColor: theme.brandOrange }
                          : fonts.heading
                      }
                    >
                      <span>Permitted</span>
                      {filterState === 'permitted' && <Check className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setFilterState('unpermitted');
                        setShowDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-3 h-10 rounded-md text-sm font-medium transition-all duration-200 ${
                        filterState === 'unpermitted'
                          ? 'text-white'
                          : `${theme.text} ${theme.itemHoverBg}`
                      }`}
                      style={
                        filterState === 'unpermitted'
                          ? { ...fonts.heading, backgroundColor: theme.brandOrange }
                          : fonts.heading
                      }
                    >
                      <span>Unpermitted</span>
                      {filterState === 'unpermitted' && <Check className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setFilterState('deleted');
                        setShowDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-3 h-10 rounded-md text-sm font-medium transition-all duration-200 ${
                        filterState === 'deleted'
                          ? 'text-white'
                          : `${theme.text} ${theme.itemHoverBg}`
                      }`}
                      style={
                        filterState === 'deleted'
                          ? { ...fonts.heading, backgroundColor: theme.brandOrange }
                          : fonts.heading
                      }
                    >
                      <span>Deleted</span>
                      {filterState === 'deleted' && <Check className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setFilterState('all');
                        setShowDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-3 h-10 rounded-md text-sm font-medium transition-all duration-200 ${
                        filterState === 'all' ? 'text-white' : `${theme.text} ${theme.itemHoverBg}`
                      }`}
                      style={
                        filterState === 'all'
                          ? { ...fonts.heading, backgroundColor: theme.brandOrange }
                          : fonts.heading
                      }
                    >
                      <span>All Apps</span>
                      {filterState === 'all' && <Check className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {apps.length === 0 ? (
            <div className="flex items-center justify-center min-h-[400px] w-full lg:mr-48">
              <div className="text-center max-w-md mx-auto px-6">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${theme.itemBg} ${theme.cardBorder} border mb-6`}
                >
                  <Package className={`w-8 h-8 ${theme.textMuted}`} />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${theme.text}`} style={fonts.heading}>
                  {emptyState.title}
                </h3>
                <p className={`text-sm ${theme.textMuted} leading-relaxed mb-4`} style={fonts.body}>
                  {emptyState.description}
                </p>
                {filterState === 'permitted' && (
                  <p className={`text-sm ${theme.textMuted} leading-relaxed`} style={fonts.body}>
                    To find applications, visit the{' '}
                    <Link
                      to="/explorer/apps"
                      className="font-medium hover:underline"
                      style={{ color: theme.brandOrange }}
                    >
                      Explorer
                    </Link>
                    .
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {apps.map((app, index) => {
                const permittedPermission = permittedPkps.find((p) => p.appId === app.appId);
                const unpermittedPermission = unpermittedPkps.find((p) => p.appId === app.appId);
                const permission = permittedPermission || unpermittedPermission;
                const isUnpermitted = !!unpermittedPermission && !permittedPermission;
                const isDeleted = permission?.isDeleted ?? false;
                return (
                  <PermittedAppCard
                    key={app.appId}
                    app={app}
                    permission={permission}
                    isUnpermitted={isUnpermitted}
                    isDeleted={isDeleted}
                    index={index}
                    appVersionsMap={appVersionsMap}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
