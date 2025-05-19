import React from 'react';
import { AppView } from '@/types';
import StatusMessage from './StatusMessage';
import UserVersionUpgradePrompt from './UserVersionUpgradePrompt';
import { NavigateFunction } from 'react-router-dom';

type StatusType = 'info' | 'warning' | 'success' | 'error' | undefined;

interface VersionUpgradeViewProps {
  appInfo: AppView;
  permittedVersion: number;
  statusMessage: string;
  statusType: StatusType;
  onUpgrade: () => void;
  navigate: NavigateFunction;
  onUpdateParameters: () => void;
}

/**
 * Component displayed when a version upgrade is available
 */
export const VersionUpgradeView: React.FC<VersionUpgradeViewProps> = ({
  appInfo,
  permittedVersion,
  statusMessage,
  statusType,
  onUpgrade,
  navigate,
  onUpdateParameters,
}) => {
  return (
    <>
      <StatusMessage message={statusMessage} type={statusType} />
      <UserVersionUpgradePrompt
        appInfo={appInfo}
        permittedVersion={permittedVersion}
        onUpgrade={onUpgrade}
        onContinue={() => navigate('/user/apps')}
        onUpdateParameters={onUpdateParameters}
      />
    </>
  );
};

export default VersionUpgradeView;
