import { useState, useCallback } from 'react';
import { useErrorPopup } from '@/providers/ErrorPopup';

export type StatusType = 'info' | 'warning' | 'success' | 'error';

export const useStatusMessage = () => {
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<StatusType>('info');
  const { showError } = useErrorPopup();

  const showStatus = useCallback((message: string, type: StatusType = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
  }, []);

  const showErrorWithStatus = useCallback((errorMessage: string, title?: string, details?: string) => {
    showError(errorMessage, title || 'Error', details);
    showStatus(errorMessage, 'error');
  }, [showError, showStatus]);

  return {
    statusMessage,
    statusType,
    showStatus,
    showErrorWithStatus
  };
};
