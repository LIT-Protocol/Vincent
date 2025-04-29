import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle } from 'lucide-react';
import { AppDetailsState } from '../../../pages/appId/types';

interface VersionUpgradeSectionProps {
  app: AppDetailsState;
  isUpgrading: boolean;
  versionStatusText: string | null;
  shouldDisableUpgrade: boolean;
  onUpgrade: () => Promise<void>;
}

/**
 * Component to display and handle version upgrades
 */
export const VersionUpgradeSection: React.FC<VersionUpgradeSectionProps> = ({
  app,
  isUpgrading,
  versionStatusText,
  shouldDisableUpgrade,
  onUpgrade,
}) => {
  if (!(app && app.permittedVersion !== null && app.latestVersion > app.permittedVersion)) {
    return null;
  }

  return (
    <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mt-4 mb-6">
      <div className="flex items-start">
        <ArrowUpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
        <div className="flex-grow">
          <h3 className="text-base font-medium text-gray-800 mb-2">Version Upgrade Available</h3>
          <p className="text-sm text-gray-600 mb-3">
            You're currently using version {app.permittedVersion}. Version {app.latestVersion} is
            now available.
          </p>

          {versionStatusText && (
            <div className="mb-4 p-3 bg-blue-100 text-blue-700 text-sm rounded">
              {versionStatusText}
            </div>
          )}

          <Button
            onClick={onUpgrade}
            disabled={isUpgrading || shouldDisableUpgrade}
            className="bg-blue-600 hover:bg-blue-700"
            title={shouldDisableUpgrade ? 'Latest version is currently disabled' : undefined}
          >
            {isUpgrading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Upgrading...
              </>
            ) : (
              'Upgrade to Latest Version'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
