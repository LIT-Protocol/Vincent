import { useState, useEffect, useMemo } from 'react';
import { Package, Plus, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppVersion as ContractAppVersion } from '@lit-protocol/vincent-contracts-sdk';

import { AppVersion } from '@/types/developer-dashboard/appTypes';
import { UndeleteAppVersionButton } from '../wrappers';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { VersionCard } from '@/components/developer-dashboard/ui/VersionCard';

type SortOption = 'published' | 'enabled';

interface AppVersionsListViewProps {
  appName: string;
  versions: AppVersion[];
  deletedVersions?: AppVersion[];
  activeVersion?: number;
  onVersionClick: (version: number) => void;
  onCreateVersion?: () => void;
  blockchainVersions: Record<number, ContractAppVersion | null>;
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
}

export function AppVersionsListView({
  appName,
  versions,
  deletedVersions,
  activeVersion,
  onVersionClick,
  onCreateVersion,
  blockchainVersions,
  sortBy,
  onSortChange,
}: AppVersionsListViewProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setShowContent(true);
  }, []);

  // Separate versions based on current sort option
  const { primaryVersions, secondaryVersions, primaryLabel, secondaryLabel } = useMemo(() => {
    if (sortBy === 'published') {
      const publishedVersions = versions.filter((v) => blockchainVersions[v.version] !== null);
      const unpublishedVersions = versions.filter((v) => blockchainVersions[v.version] === null);
      return {
        primaryVersions: publishedVersions,
        secondaryVersions: unpublishedVersions,
        primaryLabel: 'Published Versions',
        secondaryLabel: 'Unpublished Versions',
      };
    } else {
      const enabledVersions = versions.filter((v) => v.enabled);
      const disabledVersions = versions.filter((v) => !v.enabled);
      return {
        primaryVersions: enabledVersions,
        secondaryVersions: disabledVersions,
        primaryLabel: 'Enabled Versions',
        secondaryLabel: 'Disabled Versions',
      };
    }
  }, [versions, blockchainVersions, sortBy]);

  const renderVersionCard = (version: AppVersion) => (
    <VersionCard
      key={version.version}
      version={version.version}
      activeVersion={activeVersion}
      enabled={version.enabled}
      createdAt={version.createdAt}
      onClick={() => onVersionClick(version.version)}
    />
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: showContent ? 1 : 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="w-full space-y-8"
    >
      {/* Empty State */}
      {versions.length === 0 ? (
        <div
          className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
        >
          <div className="p-6">
            <div className="flex items-center justify-center min-h-[200px] w-full">
              <div className="text-center max-w-md mx-auto px-6">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${theme.itemBg} border ${theme.cardBorder} mb-6`}
                >
                  <Package className={`w-8 h-8 ${theme.textMuted}`} />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${theme.text}`} style={fonts.heading}>
                  No Versions Yet
                </h3>
                <p className={`text-sm ${theme.textMuted} leading-relaxed`} style={fonts.body}>
                  Create your first version for {appName} to get started.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Primary Versions Section */}
          {primaryVersions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${theme.text}`} style={fonts.heading}>
                  {primaryLabel}
                </h3>
                <button
                  onClick={() => onSortChange(sortBy === 'published' ? 'enabled' : 'published')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors inline-flex items-center gap-2 ${theme.mainCard} border ${theme.mainCardBorder}`}
                  style={fonts.heading}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.brandOrange;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '';
                  }}
                >
                  <ArrowUpDown className="h-4 w-4" />
                  Sort by: {sortBy === 'published' ? 'Published/Unpublished' : 'Enabled/Disabled'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {primaryVersions.map(renderVersionCard)}
              </div>
            </div>
          )}

          {/* Secondary Versions Section */}
          {secondaryVersions.length > 0 && (
            <div>
              <h3 className={`text-lg font-semibold ${theme.text} mb-4`} style={fonts.heading}>
                {secondaryLabel}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {secondaryVersions.map(renderVersionCard)}
              </div>
            </div>
          )}

          {/* Create Version CTA */}
          {onCreateVersion && (
            <div className="pt-8 border-t border-gray-200 dark:border-white/10">
              <div className="flex flex-col items-center justify-center py-6">
                <h3 className={`text-lg font-semibold ${theme.text} mb-4`} style={fonts.heading}>
                  Ready to create another version?
                </h3>
                <button
                  onClick={onCreateVersion}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors inline-flex items-center gap-2"
                  style={{ backgroundColor: theme.brandOrange, ...fonts.heading }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.brandOrange;
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create Version
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Deleted Versions Section */}
      {deletedVersions && deletedVersions.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/10">
          <h3 className={`text-lg font-semibold ${theme.textMuted} mb-4`} style={fonts.heading}>
            Deleted Versions
          </h3>
          <div className="grid gap-4">
            {deletedVersions.map((version) => (
              <div
                key={version.version}
                className={`${theme.mainCard} border border-dashed border-gray-200 dark:border-white/10 rounded-xl overflow-hidden`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3
                        className={`text-lg font-semibold ${theme.textMuted} line-through`}
                        style={fonts.heading}
                      >
                        Version {version.version}
                      </h3>
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                        style={fonts.heading}
                      >
                        DELETED
                      </span>
                      {version.version === activeVersion && (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${theme.itemBg} ${theme.textMuted}`}
                          style={fonts.heading}
                        >
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <UndeleteAppVersionButton appVersion={version} />
                    </div>
                  </div>
                  <p className={`text-sm ${theme.textSubtle} mt-2 line-through`} style={fonts.body}>
                    Created: {new Date(version.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
