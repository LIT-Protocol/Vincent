import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, Plus, Power, PowerOff, Trash2 } from 'lucide-react';
import { VersionDetails } from '@/components/developer-dashboard/app/views/AppVersionDetails';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/layout/Loading';
import { PublishAppVersionWrapper } from './PublishAppVersionWrapper';

export function AppVersionDetailWrapper() {
  const { appId, versionId } = useParams<{ appId: string; versionId: string }>();

  // Fetch app
  const {
    data: app,
    isLoading: appLoading,
    isError: appError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) });

  // Fetch app versions
  const { isLoading: versionsLoading, isError: versionsError } =
    vincentApiClient.useGetAppVersionsQuery({ appId: Number(appId) });

  // Fetch specific version data
  const {
    data: versionData,
    isLoading: versionLoading,
    isError: versionError,
  } = vincentApiClient.useGetAppVersionQuery({ appId: Number(appId), version: Number(versionId) });

  // Fetch version tools
  const {
    data: versionTools,
    isLoading: versionToolsLoading,
    isError: versionToolsError,
  } = vincentApiClient.useListAppVersionToolsQuery({
    appId: Number(appId),
    version: Number(versionId),
  });

  // Mutation
  const [
    enableAppVersion,
    { isLoading: isEnabling, isSuccess: isEnablingSuccess, isError: isEnablingError },
  ] = vincentApiClient.useEnableAppVersionMutation();
  const [
    disableAppVersion,
    { isLoading: isDisabling, isSuccess: isDisablingSuccess, isError: isDisablingError },
  ] = vincentApiClient.useDisableAppVersionMutation();

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!(isEnablingSuccess || isDisablingSuccess)) return;

    setShowSuccess(true);

    const timer = setTimeout(() => {
      setShowSuccess(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isEnablingSuccess, isDisablingSuccess]);

  // Navigation
  const navigate = useNavigate();

  useAddressCheck(app || null);

  // Loading states first
  if (appLoading || versionsLoading || versionLoading || versionToolsLoading) return <Loading />;

  // Combined error states
  if (appError) return <StatusMessage message="Failed to load app" type="error" />;
  if (versionsError) return <StatusMessage message="Failed to load app versions" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load version data" type="error" />;
  if (versionToolsError)
    return <StatusMessage message="Failed to load version tools" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;
  if (!versionData)
    return <StatusMessage message={`Version ${versionId} not found`} type="error" />;

  const onEnableVersion = () => {
    enableAppVersion({
      appId: Number(appId),
      version: Number(versionId),
    });
  };

  const onDisableVersion = () => {
    disableAppVersion({
      appId: Number(appId),
      version: Number(versionId),
    });
  };

  const isVersionEnabled = versionData?.enabled ?? false;

  const isLoading = isEnabling || isDisabling;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Version {versionId}</h1>
          <p className="text-gray-600 mt-2">View and manage this version of your application</p>
        </div>
      </div>

      {/* Status Message */}
      {showSuccess && (
        <StatusMessage message="Version enabled/disabled successfully!" type="success" />
      )}
      {isEnablingError && <StatusMessage message={`Failed to enable version`} type="error" />}
      {isDisablingError && <StatusMessage message={`Failed to disable version`} type="error" />}

      {/* Version Management Card */}
      <div className="bg-white border rounded-lg">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Version Management</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Status:</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  isVersionEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {isVersionEnabled ? (
                  <Power className="h-3 w-3" />
                ) : (
                  <PowerOff className="h-3 w-3" />
                )}
                {isVersionEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate(`/developer/appId/${appId}/version/${versionId}/edit`)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit Version
            </button>
            <button
              onClick={() => navigate(`/developer/appId/${appId}/version/${versionId}/tools`)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Manage Tools
            </button>

            {/* Enable/Disable buttons */}
            {isVersionEnabled ? (
              <button
                onClick={onDisableVersion}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDisabling ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700"></div>
                ) : (
                  <PowerOff className="h-4 w-4" />
                )}
                {isDisabling ? 'Disabling...' : 'Disable Version'}
              </button>
            ) : (
              <button
                onClick={onEnableVersion}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 border border-green-300 rounded-lg text-sm font-medium text-green-700 bg-white hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEnabling ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700"></div>
                ) : (
                  <Power className="h-4 w-4" />
                )}
                {isEnabling ? 'Enabling...' : 'Enable Version'}
              </button>
            )}
            <button
              onClick={() =>
                navigate(`/developer/appId/${appId}/version/${versionId}/delete-version`)
              }
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete Version
            </button>
            <PublishAppVersionWrapper />
          </div>
        </div>
      </div>

      {/* Version Details */}
      <VersionDetails
        version={Number(versionId)}
        appName={app.name}
        versionData={versionData}
        tools={versionTools || []}
      />
    </div>
  );
}
