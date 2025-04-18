import React from 'react';
import { AppView } from '../../types';
import { useVersionEnabledCheck } from '../../hooks/useVersionEnabledCheck';

interface VersionUpgradePromptProps {
  appInfo: AppView;
  permittedVersion: number;
  onUpgrade: () => void;
  onContinue: () => void;
  onUpdateParameters: () => void;
}

const VersionUpgradePrompt = ({
  appInfo,
  permittedVersion,
  onUpgrade,
  onContinue,
  onUpdateParameters,
}: VersionUpgradePromptProps) => {
  const { isVersionEnabled } = useVersionEnabledCheck({
    versionNumber: permittedVersion
  });
  
  const { isVersionEnabled: isLatestVersionEnabled } = useVersionEnabledCheck({
    versionNumber: Number(appInfo.latestVersion)
  });

  // Get the appropriate notice text based on version status
  const getNoticeText = () => {
    if (isLatestVersionEnabled === false && isVersionEnabled === false) {
      return `Both your current version (${permittedVersion}) and the latest version have been disabled by the app developer. Please contact the app developer for assistance.`;
    } else if (isLatestVersionEnabled === false) {
      return `The latest version of this application is currently disabled by the developer. To continue using the app, please continue without changes or update your parameters for the current version.`;
    } else if (isVersionEnabled === false) {
      return `Version ${permittedVersion} has been disabled by the app developer. To continue using the app, please update to the latest version.`;
    }
    return null;
  };

  const noticeText = getNoticeText();

  return (
    <div className="mt-4">
      <div className="mb-6">
        <div className="bg-gray-50 p-4 rounded-md border border-gray-100 mb-4">
          <div className="flex items-start">
            <div className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-800 mb-2">Version Upgrade Available</h3>
              <p className="text-sm text-gray-600">
                You already have permission for version {permittedVersion} of {appInfo.name},
                but version {appInfo.latestVersion.toString()} is now available.
              </p>
              
              {noticeText && (
                <p className="text-sm text-blue-600 mt-2">
                  {noticeText}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-3 mt-6">
          {/* Show standard buttons unless both versions are disabled */}
          {!(isVersionEnabled === false && isLatestVersionEnabled === false) ? (
            <>
              <button
                className="bg-white text-gray-700 border border-gray-200 rounded-lg py-3 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onUpdateParameters}
                disabled={isVersionEnabled === false}
                title={isVersionEnabled === false ? "Current version is disabled and cannot be updated" : "Update parameters for the current version"}
              >
                Update Policies Only
              </button>
              <button
                className="bg-white text-gray-700 border border-gray-200 rounded-lg py-3 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onContinue}
                title="Continue using the current version without changes"
              >
                Continue Without Changes
              </button>
              <button
                className="bg-black text-white rounded-lg py-3 font-medium text-sm hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onUpgrade}
                disabled={isLatestVersionEnabled === false}
                title={isLatestVersionEnabled === false ? "Latest version is currently disabled" : "Update to the latest version"}
              >
                Update to Latest Version
              </button>
            </>
          ) : (
            // When both versions are disabled, show a special "Go Back" button instead
            <button
              className="bg-black text-white rounded-lg py-3 font-medium text-sm hover:bg-gray-900 transition-colors"
              onClick={onContinue}
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionUpgradePrompt;