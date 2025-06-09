import { Helmet } from 'react-helmet';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllApps } from '@/utils/user-dashboard/userAppsUtils';
import { AppDetails } from '@/types';
import Loading from '@/layout/app-dashboard/Loading';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/app-dashboard/ui/badge';
import { Users, ExternalLink, Calendar } from 'lucide-react';

const getDeploymentStatusBadge = (status: number) => {
  switch (status) {
    case 2: // Production
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          Production
        </Badge>
      );
    case 1: // Testing
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          Testing
        </Badge>
      );
    case 0: // Development
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
          Development
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const AppLogo = ({ app }: { app: AppDetails }) => {
  const [imageError, setImageError] = useState(false);

  if (app.logo && !imageError) {
    const logoSrc = app.logo.startsWith('data:') ? app.logo : `data:image/png;base64,${app.logo}`;

    return (
      <img
        src={logoSrc}
        alt={`${app.name} logo`}
        className="w-12 h-12 rounded-xl object-cover shadow-lg"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-gray-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
      {app.name.charAt(0)}
    </div>
  );
};

export default function ExplorerPage() {
  const navigate = useNavigate();

  // Apps state
  const [apps, setApps] = useState<AppDetails[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState<boolean>(true);
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
    navigate(`/user/appId/${appId}`);
  };

  const handleConnectApp = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
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
                      <div
                        key={app.id}
                        onClick={() => handleAppClick(app.id)}
                        className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-gray-300 hover:-translate-y-1 flex flex-col h-full"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <AppLogo app={app} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-gray-900">{app.name}</h3>
                                {getDeploymentStatusBadge(app.deploymentStatus)}
                              </div>
                              <p className="text-sm text-gray-600 font-medium">Application</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                            {app.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>v{app.version}</span>
                            </div>
                            {app.updatedAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(app.updatedAt).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleConnectApp(e, app.id)}
                            className="transition-colors"
                          >
                            Connect
                          </Button>
                        </div>
                      </div>
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
                    <div
                      key={app.id}
                      onClick={() => handleAppClick(app.id)}
                      className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <AppLogo app={app} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">{app.name}</h3>
                              {getDeploymentStatusBadge(app.deploymentStatus)}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <span>v{app.version}</span>
                              </div>
                              {app.updatedAt && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(app.updatedAt).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {app.appUserUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(app.appUserUrl, '_blank');
                              }}
                              className="shrink-0 text-gray-600 hover:text-gray-900"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleConnectApp(e, app.id)}
                            className="transition-colors"
                          >
                            Connect
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
