import { useState, useCallback, useEffect } from 'react';
import { useErrorPopup } from '@/providers/ErrorPopup';
import { useNavigate, Link } from 'react-router-dom';
import { AppDetails } from '@/types';
import { AppCard } from '../../app-dashboard/ui/AppCard';
import { SessionSigs, IRelayPKP } from '@lit-protocol/types';
import { fetchUserApps } from '@/utils/user-dashboard/userAppsUtils';
import StatusMessage from '../consent/StatusMessage';

export interface UserAppsViewProps {
  userPKP: IRelayPKP;
  sessionSigs: SessionSigs;
  agentPKP: IRelayPKP;
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
    return <StatusMessage message="Loading your applications..." type="info" />;
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

      {apps.length === 0 ? (
        <div className="border border-gray-200 rounded-lg p-12 text-center bg-gray-50">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">No Connected Apps</h2>
          <p className="text-gray-600 text-lg mb-6">
            You haven't connected any applications yet. When you authorize apps to access your
            Vincent identity, they'll appear here.
          </p>
          <p className="text-gray-500">
            Check out the <Link to="/user/explorer">Explorer</Link> to find apps that support
            Vincent authentication.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your Connected Apps</h2>
            <p className="text-gray-600">
              {apps.length} {apps.length === 1 ? 'application' : 'applications'} connected to your
              Vincent identity
            </p>
          </div>

          <div className="space-y-4">
            {apps.map((app) => (
              <AppCard key={app.id} app={app} onClick={handleCardClick} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
