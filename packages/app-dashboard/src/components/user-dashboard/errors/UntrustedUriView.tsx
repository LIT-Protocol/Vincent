import React from 'react';
import { AppView } from '@/types';
import StatusMessage from '../consent/StatusMessage';
import UntrustedUriError from './UntrustedUriError';

type StatusType = 'info' | 'warning' | 'success' | 'error' | undefined;

interface UntrustedUriViewProps {
  redirectUri: string | null;
  appInfo: AppView | null;
  statusMessage: string;
  statusType: StatusType;
}

/**
 * Component displayed when the redirect URI is untrusted
 */
export const UntrustedUriView: React.FC<UntrustedUriViewProps> = ({
  redirectUri,
  appInfo,
  statusMessage,
  statusType,
}) => {
  return (
    <>
      <StatusMessage message={statusMessage} type={statusType} />
      <UntrustedUriError redirectUri={redirectUri} appInfo={appInfo} />
    </>
  );
};

export default UntrustedUriView;
