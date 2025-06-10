import { Helmet } from 'react-helmet';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchAllApps } from '@/utils/user-dashboard/userAppsUtils';
import { AppDetails } from '@/types';
import Loading from '@/layout/app-dashboard/Loading';
import { AppCard } from '@/components/app-dashboard/explorer/AppCard';
import { AppDetailsModal } from '@/components/app-dashboard/explorer/AppDetailsModal';

export default function ExplorerPage() {
  const navigate = useNavigate();
  const params = useParams();

  // Apps state
  const [apps, setApps] = useState<AppDetails[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'warning' | 'success' | 'error'>('info');

  // Modal state
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get selected app ID from URL params
  const appIdFromUrl = params.appId;

  // Handle URL changes to open/close modal
  useEffect(() => {
    if (appIdFromUrl) {
      setSelectedAppId(appIdFromUrl);
      setIsModalOpen(true);
    } else {
      setSelectedAppId(null);
      setIsModalOpen(false);
    }
  }, [appIdFromUrl]);

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

  // Load all apps
  useEffect(() => {
    let isMounted = true;

    async function loadApps() {
      setIsLoadingApps(true);

      const result = await fetchAllApps();

      if (isMounted) {
        if (result.error) {
          showStatus(result.error, 'error');
        } else {
          setApps(result.apps);
        }
        setIsLoadingApps(false);
      }
    }

    loadApps();

    return () => {
      isMounted = false;
    };
  }, [showStatus]);

  const handleAppClick = (appId: string) => {
    navigate(`/user/explorer/appId/${appId}`);
  };

  const handleConnectApp = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    navigate(`/user/explorer/appId/${appId}`);
  };

  const handleCloseModal = () => {
    navigate('/user/explorer');
  };

  const handleConnectToApp = (appId: string) => {
    navigate(`/user/appId/${appId}`);
  };

  // Get featured apps (newest 3) - memoized for performance
  const featuredApps = useMemo(() => {
    return apps
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA; // Sort newest first
      })
      .slice(0, 3);
  }, [apps]);

  // Show loading while fetching apps
  if (isLoadingApps) {
    return (
      <>
        <Helmet>
          <title>Vincent | Explorer</title>
          <meta name="description" content="Explore all Vincent applications" />
        </Helmet>
        <main className="p-8 flex items-center justify-center min-h-screen">
          <Loading />
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Vincent | Explorer</title>
        <meta name="description" content="Explore all Vincent applications" />
      </Helmet>

      <div className="bg-white min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Explorer</h1>
            <p className="text-gray-600">Discover and connect to Vincent applications</p>
          </div>

          {/* Status Message */}
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
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">No Applications Found</h2>
              <p className="text-gray-600 text-lg mb-6">
                No applications are currently available in the Vincent registry.
              </p>
              <p className="text-gray-500">
                Check back later as developers add more applications to the platform.
              </p>
            </div>
          ) : (
            <>
              {/* Featured Applications */}
              {featuredApps.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Newest Applications</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredApps.map((app) => (
                      <AppCard
                        key={app.id}
                        app={app}
                        onAppClick={handleAppClick}
                        onConnectApp={handleConnectApp}
                        variant="featured"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Applications */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {featuredApps.length > 0 ? 'All Applications' : 'Applications'}
                  </h2>
                  <div className="text-sm text-gray-600">
                    {apps.length} application{apps.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="space-y-3">
                  {apps.map((app) => (
                    <AppCard
                      key={app.id}
                      app={app}
                      onAppClick={handleAppClick}
                      onConnectApp={handleConnectApp}
                      variant="list"
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* App Details Modal */}
      <AppDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedAppId={selectedAppId}
        onConnectToApp={handleConnectToApp}
      />
    </>
  );
}
