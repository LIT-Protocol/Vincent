import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { useAccount } from 'wagmi';
import {
  ArrowLeft,
  Settings,
  Plus,
  Trash2,
  Edit,
  FileText,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

import { Button } from '@/components/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/app-dashboard/ui/card';
import { useErrorPopup } from '@/providers/ErrorPopup';
import { StatusMessage } from '@/utils/shared/statusMessage';
import { vincentApiClient } from '@/components/app-dashboard/mock-forms/vincentApiClient';

// Import app management forms
import {
  EditAppForm,
  DeleteAppForm,
  CreateAppVersionForm,
  EditAppVersionForm,
} from '@/components/app-dashboard/mock-forms/generic/AppForms';

// Form components mapping
const formComponents: {
  [key: string]: {
    component: React.ComponentType<{ appData?: any }>;
    title: string;
    description: string;
  };
} = {
  edit: {
    component: EditAppForm,
    title: 'Edit App',
    description: 'Update app details and configuration',
  },
  delete: {
    component: DeleteAppForm,
    title: 'Delete App',
    description: 'Permanently delete this application',
  },
  'create-version': {
    component: CreateAppVersionForm,
    title: 'Create App Version',
    description: 'Create a new version of this app',
  },
  'edit-version': {
    component: EditAppVersionForm,
    title: 'Edit App Version',
    description: 'Update an existing app version',
  },
};

// Menu items for app management
const appMenuItems = [
  { id: 'app-details', label: 'App Details', icon: FileText },
  {
    id: 'app-management',
    label: 'App Management',
    icon: Settings,
    submenu: [
      { id: 'edit', label: 'Edit App' },
      { id: 'delete', label: 'Delete App' },
      { id: 'create-version', label: 'Create App Version' },
      { id: 'edit-version', label: 'Edit App Version' },
    ],
  },
];

export function AppDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { address, isConnected } = useAccount();

  const [app, setApp] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['app-management']));

  // Get current action from URL path
  const getActionFromPath = () => {
    const path = location.pathname;
    const appIdPattern = `/appId/${params.appId}`;

    if (path === appIdPattern) {
      return null; // Default app details view
    }

    const actionPart = path.replace(`${appIdPattern}/`, '');
    return actionPart;
  };

  const currentAction = getActionFromPath();
  const appIdParam = params.appId;
  const { showError } = useErrorPopup();

  // Helper function to set status messages
  const showStatus = useCallback(
    (message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
      setStatusMessage(message);
      setStatusType(type);
    },
    [],
  );

  // Create enhanced error function
  const showErrorWithStatus = useCallback(
    (errorMessage: string, title?: string, details?: string) => {
      showError(errorMessage, title || 'Error', details);
      showStatus(errorMessage, 'error');
    },
    [showError, showStatus],
  );

  // Use the proper GET endpoint for a single app
  const {
    data: apiApp,
    error: apiError,
    isLoading: isApiLoading,
  } = vincentApiClient.useGetAppQuery(
    { appId: parseInt(appIdParam || '0') },
    { skip: !appIdParam },
  );

  // Handle menu expansion (but prevent closing app-management)
  const toggleMenu = (menuId: string) => {
    if (menuId === 'app-management') return; // Prevent toggling app-management

    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  // Handle navigation and form selection
  const handleMenuSelection = (id: string) => {
    if (id === 'app-details') {
      navigate(`/appId/${appIdParam}`);
    } else if (formComponents[id]) {
      navigate(`/appId/${appIdParam}/${id}`);
    }
  };

  const loadAppData = useCallback(async () => {
    if (!address || !appIdParam) {
      return;
    }

    try {
      setIsLoading(true);

      if (isApiLoading) {
        return;
      }

      if (apiError) {
        console.error('Error fetching app from API:', apiError);
        showErrorWithStatus('Failed to load app data from API', 'Error');
        return;
      }

      if (apiApp) {
        // Check if the current user is the manager of this app
        if (
          apiApp.managerAddress &&
          apiApp.managerAddress.toLowerCase() === address.toLowerCase()
        ) {
          setApp(apiApp);
        } else {
          // User is not authorized to view this app
          showErrorWithStatus('You are not authorized to view this app', 'Access Denied');
          setApp(null);
        }
      } else {
        setApp(null);
      }
    } catch (error) {
      console.error('Error processing app data:', error);
      showErrorWithStatus('Failed to load app data', 'Error');
      setApp(null);
    } finally {
      setIsLoading(false);
    }
  }, [address, appIdParam, showErrorWithStatus, apiApp, apiError, isApiLoading]);

  useEffect(() => {
    if (isConnected && !isApiLoading) {
      loadAppData();
    } else if (!isConnected) {
      navigate('/');
    }
  }, [isConnected, loadAppData, navigate, isApiLoading]);

  if (!isConnected) {
    navigate('/');
    return null;
  }

  if (isLoading || isApiLoading) {
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
    navigate('/');
    return null;
  }

  // App details view component
  const renderAppDetails = () => {
    // Filter out unnecessary fields and format dates
    const filteredApp: [string, any][] = Object.entries(app)
      .filter(
        ([key]) => !['_id', '__v', 'logo', 'managerAddress', 'name', 'description'].includes(key),
      )
      .map((entry: [string, any]) => {
        const [key, value] = entry;
        if (key === 'createdAt' || key === 'updatedAt') {
          return [key, new Date(value as string).toLocaleString()];
        }
        return [key, value];
      });

    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{app.name}</h1>
            <p className="text-gray-600 mt-2">{app.description}</p>
          </div>
          {app.logo && (
            <div className="ml-6 flex-shrink-0">
              <img
                src={app.logo.startsWith('data:') ? app.logo : `data:image/png;base64,${app.logo}`}
                alt="App logo"
                className="w-16 h-16 rounded-lg border shadow-sm object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const errorDiv = document.createElement('div');
                  errorDiv.className =
                    'w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center text-xs text-gray-500';
                  errorDiv.textContent = 'No Logo';
                  target.parentNode?.appendChild(errorDiv);
                }}
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">App Information</CardTitle>
              <CardDescription className="text-gray-700">Application details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {filteredApp.map((entry: [string, any]) => {
                  const [key, value] = entry;
                  return (
                    <div key={key} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <span className="font-medium text-gray-600 text-sm uppercase tracking-wide">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <div className="mt-1 sm:mt-0 sm:text-right">
                          {Array.isArray(value) ? (
                            <div className="space-y-1">
                              {value.map((item, index) => (
                                <div key={index}>
                                  <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm">
                                    {item}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : key === 'appUserUrl' ? (
                            <a
                              href={String(value)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              {String(value)}
                            </a>
                          ) : key === 'deploymentStatus' ? (
                            <span
                              className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                                value === 'prod'
                                  ? 'bg-green-100 text-green-800'
                                  : value === 'test'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {String(value).toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-gray-900 text-sm">{String(value)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200">
        <div className="p-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-xl font-bold text-gray-900 mb-6 hover:text-blue-600 transition-colors cursor-pointer"
            style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'none' }}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <nav className="space-y-2">
            {appMenuItems.map((item) => {
              const Icon = item.icon;

              // Handle items with submenus
              if (item.submenu) {
                const isExpanded = expandedMenus.has(item.id);
                const isAppManagement = item.id === 'app-management';

                return (
                  <div key={item.id}>
                    <div
                      className="w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors text-gray-700"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    >
                      <div className="flex items-center">
                        <Icon className="h-5 w-5 mr-3" />
                        {item.label}
                      </div>
                      {!isAppManagement && (
                        <button
                          onClick={() => toggleMenu(item.id)}
                          style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                    {isExpanded && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.submenu.map((subItem) => (
                          <button
                            key={subItem.id}
                            onClick={() => handleMenuSelection(subItem.id)}
                            className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-colors ${
                              currentAction === subItem.id
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                            style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                          >
                            {subItem.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // Handle regular items
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuSelection(item.id)}
                  className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
                    item.id === 'app-details' && !currentAction
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {statusMessage && <StatusMessage message={statusMessage} type={statusType} />}

          {currentAction && formComponents[currentAction] ? (
            // Render selected form
            app ? (
              (() => {
                const FormComponent = formComponents[currentAction].component;
                return <FormComponent appData={app} />;
              })()
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                <span className="ml-2 text-gray-600">Loading app data...</span>
              </div>
            )
          ) : (
            // Render app details
            renderAppDetails()
          )}
        </div>
      </div>
    </div>
  );
}

export default AppDetail;
