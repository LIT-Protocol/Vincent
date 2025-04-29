import React from 'react';
import { StatusMessage } from '@/components/layout/statusMessage';
import { StatusType } from '../types';

interface StatusHandlerProps {
  statusMessage: string;
  statusType: StatusType;
}

/**
 * Component to display status messages
 */
export const StatusHandler: React.FC<StatusHandlerProps> = ({ statusMessage, statusType }) => {
  if (!statusMessage) return null;

  return <StatusMessage message={statusMessage} type={statusType} />;
};
