import { useState, useCallback } from 'react';

export const useStatusMessage = () => {
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'warning' | 'success' | 'error'>('info');

  const showStatus = useCallback(
    (message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
      setStatusMessage(message);
      setStatusType(type);

      if (type === 'success' || type === 'info') {
        setTimeout(() => {
          setStatusMessage('');
        }, 5000);
      }
    },
    [],
  );

  const showErrorWithStatus = useCallback((errorMessage: string) => {
    setStatusMessage(errorMessage);
    setStatusType('error');
  }, []);

  return {
    statusMessage,
    statusType,
    showStatus,
    showErrorWithStatus,
  };
};
