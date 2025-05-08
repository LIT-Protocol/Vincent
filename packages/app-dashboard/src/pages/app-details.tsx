import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAccount } from 'wagmi';
import { ArrowRight, Plus, Settings, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useErrorPopup } from '@/providers/ErrorPopup';
import { StatusMessage } from '@/utils/statusMessage';
import { AppUrlGenerator } from '@/components/developer/dashboard/AppUrlGenerator';
import getApp from '@/api/app/get';
import { IAppDef } from '@/api/app/types';

export function AppDetail() {
  const params = useParams();
  const appIdParam = params.appId;
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const [app, setApp] = useState<IAppDef | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'warning' | 'success' | 'error'>('info');

  // Add the error popup hook
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
      // Show error in popup
      showError(errorMessage, title || 'Error', details);
      // Also show in status message
      showStatus(errorMessage, 'error');
    },
    [showError, showStatus],
  );

  const loadAppData = useCallback(async () => {
    if (!appIdParam) return;

    try {
      setIsLoading(true);
      // Simply fetch the app using its ID
      const appId = parseInt(appIdParam);
      const appData = await getApp(appId);

      if (appData) {
        setApp(appData);
      } else {
        // If app not found, navigate back to dashboard
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
    <div className="space-y-8">
      {statusMessage && <StatusMessage message={statusMessage} type={statusType} />}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowRight className="h-4 w-4 rotate-180" />
          </Button>
          <h1 className="text-3xl font-bold text-black">{app.name}</h1>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" onClick={() => navigate(`/appId/${app.appId}/edit`)}>
            <Edit className="h-4 w-4 mr-2 font-bold text-black" />
            Edit App
          </Button>
          {app.redirectUrls && app.redirectUrls.length > 0 && (
            <AppUrlGenerator appId={app.appId} redirectUrls={app.redirectUrls} />
          )}
          <Button variant="outline" onClick={() => navigate(`/appId/${app.appId}/delegatee`)}>
            <Plus className="h-4 w-4 mr-2 font-bold text-black" />
            Manage Delegatees
          </Button>
          <Button variant="outline" onClick={() => navigate(`/appId/${app.appId}/tool-policies`)}>
            <Plus className="h-4 w-4 mr-2 font-bold text-black" />
            Manage Tool Policies
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/appId/${app.appId}/advanced-functions`)}
          >
            <Settings className="h-4 w-4 mr-2 font-bold text-black" />
            Advanced Functions
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-black">App Details</CardTitle>
            <CardDescription className="text-black">{app.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-black">
                <span className="font-medium">App ID:</span> {app.appId}
              </div>
              <div className="text-sm text-black">
                <span className="font-medium">Identity:</span> {app.identity}
              </div>
              <div className="text-sm text-black">
                <span className="font-medium">Active Version:</span> {app.activeVersion}
              </div>
              <div className="text-sm text-black">
                <span className="font-medium">Contact Email:</span> {app.contactEmail}
              </div>
              <div className="text-sm text-black">
                <span className="font-medium">App User URL:</span> {app.appUserUrl}
              </div>
              <div className="text-sm text-black">
                <span className="font-medium">Deployment Status:</span>{' '}
                {app.deploymentStatus.toUpperCase()}
              </div>
              <div className="text-sm text-black">
                <span className="font-medium">Management Wallet:</span> {app.managerAddress}
              </div>
              <div className="text-sm text-black">
                <span className="font-medium">Last Updated:</span>{' '}
                {app.lastUpdated.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-black">Redirect URLs</CardTitle>
            <CardDescription className="text-black">
              {app.redirectUrls.length === 0
                ? 'No redirect URLs configured yet.'
                : `${app.redirectUrls.length} authorized redirect URLs`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {app.redirectUrls.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-black">No Redirect URLs Yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {app.redirectUrls.map((url, index) => (
                  <div
                    key={index}
                    className="text-sm text-black break-words p-2 bg-gray-50 rounded"
                  >
                    {url}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {app.logo && (
          <Card>
            <CardHeader>
              <CardTitle className="text-black">App Logo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <img
                  src={app.logo}
                  alt={`${app.name} logo`}
                  className="max-h-48 object-contain rounded"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default AppDetail;
