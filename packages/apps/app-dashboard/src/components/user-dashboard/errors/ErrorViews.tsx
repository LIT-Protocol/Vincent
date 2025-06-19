import React from 'react';
import StatusMessage from '../consent/StatusMessage';
import AppNotFoundError from './AppNotFoundError';
import DeletedAppError from './DeletedAppError';

type StatusType = 'info' | 'warning' | 'success' | 'error' | undefined;

interface ErrorViewProps {
  statusMessage: string;
  statusType: StatusType;
}

/**
 * Component displayed when the app is not found
 */
export const AppNotFoundView: React.FC<ErrorViewProps> = ({ statusMessage, statusType }) => {
  return (
    <>
      <StatusMessage message={statusMessage} type={statusType} />
      <AppNotFoundError />
    </>
  );
};

/**
 * Component displayed when the app is deleted
 */
export const AppDeletedView: React.FC<ErrorViewProps> = ({ statusMessage, statusType }) => {
  return (
    <>
      <StatusMessage message={statusMessage} type={statusType} />
      <DeletedAppError />
    </>
  );
};

/**
 * Component displayed while loading
 */
export const LoadingView: React.FC<ErrorViewProps> = ({ statusMessage, statusType }) => {
  return (
    <StatusMessage
      message={statusMessage || 'Loading application details...'}
      type={statusType || 'info'}
    />
  );
};
