import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAccount } from 'wagmi';
import { useErrorPopup } from '@/providers/ErrorPopup';
import { StatusMessage } from '@/utils/statusMessage';
import AppVersions from '@/components/developer/dashboard/AppVersions';
import getApp from '@/api/app/get';
import { IAppDef } from '@/api/app/types';

export function AppVersionsPage() {
  const params = useParams();
  const appIdParam = params.appId;
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const [app, setApp] = useState<IAppDef | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'warning' | 'success' | 'error'>('info');

  const { showError } = useErrorPopup();

  // Helper function to set status messages
  const showStatus = useCallback(
    (message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
      setStatusMessage(message);
      setStatusType(type);
    },
    [],
  );

  // Create enhanced error function that shows both popup and status error
  const showErrorWithStatus = useCallback(
    (errorMessage: string, title?: string, details?: string) => {
      showError(errorMessage, title || 'Error', details);
      showStatus(errorMessage, 'error');
    },
    [showError, showStatus],
  );

  const loadAppData = useCallback(async () => {
    if (!appIdParam) return;

    try {
      setIsLoading(true);
      const appId = parseInt(appIdParam);
      const appData = await getApp(appId);

      if (appData) {
        setApp(appData);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading app data:', error);
      showErrorWithStatus('Failed to load app data', 'Error');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [appIdParam, navigate, showErrorWithStatus]);

  useEffect(() => {
    if (isConnected) {
      loadAppData();
    } else {
      navigate('/');
    }
  }, [isConnected, loadAppData, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!app) {
    return null;
  }

  return (
    <div>
      {statusMessage && <StatusMessage message={statusMessage} type={statusType} />}

      <AppVersions
        appId={app.appId}
        activeVersion={app.activeVersion}
        onBack={() => navigate(`/appId/${app.appId}`)}
      />
    </div>
  );
}

export default AppVersionsPage;
