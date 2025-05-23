import React from 'react';
import { AppView, ContractVersionResult } from '@/types';
import { NavigateFunction } from 'react-router-dom';
import { Button } from '@/components/shared/ui/button';

interface DisabledAppViewProps {
  appInfo: AppView;
  versionInfo: ContractVersionResult;
  navigate: NavigateFunction;
}

/**
 * Component displayed when an app version is disabled
 */
export const DisabledAppView: React.FC<DisabledAppViewProps> = ({
  appInfo,
  versionInfo,
  navigate,
}) => {
  return (
    <>
      <div className="text-xl font-semibold text-center mb-2">
        {appInfo.appName} wants to use your Agent Wallet
      </div>

      {appInfo.description && (
        <div className="text-center text-gray-600 text-sm mb-4">
          {appInfo.description}
          <br></br>
          Version: {versionInfo ? versionInfo.appVersion.version.toString() : 'No version data'} •
          App Mode:{' '}
          {appInfo.deploymentStatus === 0
            ? 'DEV'
            : appInfo.deploymentStatus === 1
              ? 'TEST'
              : appInfo.deploymentStatus === 2
                ? 'PROD'
                : 'Unknown'}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
        <p className="text-sm text-gray-700">
          <span className="font-medium">Notice:</span> This version of {appInfo.appName} is
          currently disabled by the developer and cannot be authorized. Please contact the app
          developer for assistance or try again later.
        </p>
      </div>

      <div className="flex justify-center mt-6">
        <Button
          className="rounded-lg py-3 px-8 font-medium text-sm hover:bg-gray-900 transition-colors"
          onClick={() => {
            navigate('/user/apps');
          }}
        >
          Go Back
        </Button>
      </div>
    </>
  );
};

export default DisabledAppView;
