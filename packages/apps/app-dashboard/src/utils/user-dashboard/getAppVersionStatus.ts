import { App } from '@/types/developer-dashboard/appTypes';

type WarningType = 'yellow' | 'orange' | 'red' | null;

interface VersionStatusOptions {
  app: App;
  permittedVersion: string | undefined;
  appVersionsMap: Record<string, any[]>;
  includeDetailText?: boolean;
}

interface VersionStatusResult {
  warningType: WarningType;
  statusText: string;
  statusColor: string;
  bgColor: string;
  detailText?: string;
  hasVersionMismatch: boolean;
  activeVersion: string | undefined;
  permittedVersionEnabled: boolean | null;
  activeVersionEnabled: boolean | null;
}

/**
 * Calculate version status for an app permission
 * Determines warning level, status text, and styling based on version comparison and enabled states
 */
export function getAppVersionStatus({
  app,
  permittedVersion,
  appVersionsMap,
  includeDetailText = false,
}: VersionStatusOptions): VersionStatusResult {
  const appId = app.appId.toString();
  const activeVersion = app.activeVersion?.toString();
  const appVersions = appVersionsMap[appId] || [];

  // Find version objects
  const permittedVersionObj = appVersions.find((v) => v.version.toString() === permittedVersion);
  const activeVersionObj = appVersions.find((v) => v.version.toString() === activeVersion);

  // Check enabled status
  const permittedVersionEnabled = permittedVersionObj?.enabled ?? null;
  const activeVersionEnabled = activeVersionObj?.enabled ?? null;

  // Determine warning type
  const hasVersionMismatch = !!(
    permittedVersion &&
    activeVersion &&
    permittedVersion !== activeVersion
  );
  let warningType: WarningType = null;
  let statusText = 'Status Unavailable';
  let statusColor = 'text-gray-600 dark:text-gray-400';
  let bgColor = 'bg-gray-500/10';
  let detailText = 'Unable to retrieve version information';

  // Default to Up to Date only if we have version data and everything is enabled
  if (permittedVersionEnabled === true && activeVersionEnabled === true && !hasVersionMismatch) {
    statusText = 'Up to Date';
    statusColor = 'text-green-600 dark:text-green-400';
    bgColor = 'bg-green-500/10';
    detailText = 'Your permissions are current';
  }

  // Check for version mismatch OR if permitted version is disabled but active is enabled
  // This gives priority to updating when an update can fix the problem
  if (hasVersionMismatch || (permittedVersionEnabled === false && activeVersionEnabled === true)) {
    warningType = 'yellow';
    statusText = 'Update Available';
    statusColor = 'text-yellow-600 dark:text-yellow-400';
    bgColor = 'bg-yellow-500/10';

    if (hasVersionMismatch && permittedVersionEnabled === false) {
      detailText = 'Your version is disabled. Update to the latest version';
    } else if (permittedVersionEnabled === false) {
      detailText = 'Your version is disabled. Please update';
    } else {
      detailText = 'A newer version is available';
    }
  }

  // Check if active version is disabled (can't be fixed by updating)
  if (activeVersionEnabled === false && permittedVersionEnabled !== false) {
    warningType = 'orange';
    statusText = 'Version Disabled';
    statusColor = 'text-orange-600 dark:text-orange-400';
    bgColor = 'bg-orange-500/10';
    detailText = 'The latest version has been disabled';
  }

  // Check if both versions are disabled (highest priority - worst case)
  if (permittedVersionEnabled === false && activeVersionEnabled === false) {
    warningType = 'red';
    statusText = 'Versions Disabled';
    statusColor = 'text-red-600 dark:text-red-400';
    bgColor = 'bg-red-500/10';
    detailText = 'Both your version and the latest version are disabled';
  }

  const result: VersionStatusResult = {
    warningType,
    statusText,
    statusColor,
    bgColor,
    hasVersionMismatch,
    activeVersion,
    permittedVersionEnabled,
    activeVersionEnabled,
  };

  // Only include detailText if requested
  if (includeDetailText) {
    result.detailText = detailText;
  }

  return result;
}
