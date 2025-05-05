import { useState, useCallback, useEffect } from 'react';
import { useErrorPopup } from '@/providers/ErrorPopup';
import { useNavigate } from 'react-router-dom';
import { AppDetails } from '@/components/consent/types';
import { AppCard } from './AppCard';
import { SessionSigs, IRelayPKP } from '@lit-protocol/types';
import { fetchUserApps } from '@/components/user/userAppsUtils';
import Loading from '../consent/components/Loading';

export interface UserAppsViewProps {
  userPKP: IRelayPKP;
  sessionSigs: SessionSigs;
  agentPKP?: IRelayPKP;
}

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

  // Load apps when component mounts
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
      });

      if (isMounted) {
        if (result.error) {
          showError(
            result.error,
            'Error',
            'Please try again, or contact support if the problem persists.',
          );
        } else {
          setApps(result.apps);
        }
        setIsLoading(false);
      }
    }

    loadApps();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCardClick = (appId: string) => {
    navigate(`/user/appId/${appId}`);
  };

  if (isLoading) {
    return <Loading copy="Loading your applications..." />;
  }

  return (
    <div className="w-full">
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
