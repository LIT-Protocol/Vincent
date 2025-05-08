import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAccount } from 'wagmi';
import Loading from '@/components/layout/Loading';
import EditApplication from '@/components/developer/dashboard/EditApplication';
import getApp from '@/api/app/get';
import { IAppDef } from '@/api/app/types';
import { useErrorPopup } from '@/providers/ErrorPopup';

export function AppEdit() {
  const params = useParams();
  const appIdParam = params.appId;

  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const [app, setApp] = useState<IAppDef | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const { showError } = useErrorPopup();

  const loadAppData = useCallback(async () => {
    if (!appIdParam) return;

    try {
      setIsLoading(true);
      const appId = parseInt(appIdParam);
      const appData = await getApp(appId);

      if (appData) {
        setApp(appData);
      } else {
        showError('App not found', 'Error');
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading app data:', error);
      showError('Failed to load application data', 'Error');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [appIdParam, navigate, showError]);

  useEffect(() => {
    if (isConnected) {
      loadAppData();
    } else {
      navigate('/');
    }
  }, [isConnected, loadAppData, navigate]);

  const handleBack = useCallback(() => {
    if (appIdParam) {
      navigate(`/appId/${appIdParam}`);
    } else {
      navigate('/');
    }
  }, [appIdParam, navigate]);

  const handleSuccess = useCallback(() => {
    if (appIdParam) {
      navigate(`/appId/${appIdParam}`);
    }
  }, [appIdParam, navigate]);

  if (!app || isLoading) {
    return <Loading />;
  }

  return <EditApplication app={app} onBack={handleBack} onSuccess={handleSuccess} />;
}

export default AppEdit;
