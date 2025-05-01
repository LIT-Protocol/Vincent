import { useState, useCallback, useEffect } from 'react';
import { useErrorPopup } from '@/providers/ErrorPopup';
import { useNavigate } from 'react-router-dom';
import { UserAppsViewProps, AppDetails } from './types';
import { AppCard } from './AppCard';
import { fetchUserApps } from '@/components/user/userAppsUtils';

export default function UserAppsView({ userPKP, sessionSigs, agentPKP }: UserAppsViewProps) {
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
  const [apps, setApps] = useState<AppDetails[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const navigate = useNavigate();
  const { showError } = useErrorPopup();

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

  const showErrorWithStatus = useCallback(
    (errorMessage: string, title?: string, details?: string) => {
      showError(errorMessage, title || 'Error', details);
      showStatus(errorMessage, 'error');
    },
    [showError, showStatus],
  );

  // Load apps when component mounts or dependencies change
  useEffect(() => {
    let isMounted = true;

    async function loadApps() {
      setIsLoading(true);

      if (!userPKP || !sessionSigs || !agentPKP) {
        showErrorWithStatus('Missing required authentication. Please reconnect your wallet.');
        setIsLoading(false);
        return;
      }

      const result = await fetchUserApps({
        userPKP,
        sessionSigs,
        agentPKP,
        showStatus,
        showErrorWithStatus,
      });

      if (isMounted) {
        setApps(result.apps);
        setIsLoading(false);
      }
    }

    loadApps();

    return () => {
      isMounted = false;
    };
  }, [userPKP, sessionSigs, agentPKP, showStatus, showErrorWithStatus]);

  const handleCardClick = (appId: string) => {
    navigate(`/user/appId/${appId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-sm text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Applications</h1>
      </div>

      {statusMessage && (
        <div
          className={`p-4 mb-6 rounded-lg border ${
            statusType === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : statusType === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {statusMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <AppCard key={app.id} app={app} onClick={handleCardClick} />
        ))}
      </div>
    </div>
  );
}
