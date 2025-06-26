import { useNavigate } from 'react-router';
import { Edit, Plus, Power, PowerOff } from 'lucide-react';
import { VersionDetails } from '@/components/developer-dashboard/app/VersionDetails';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { useState } from 'react';
import {
  handleEnableVersion,
  handleDisableVersion,
} from '@/utils/developer-dashboard/version-actions';
import { App } from '@/contexts/DeveloperDataContext';

interface AppVersionDetailProps {
  app: App;
  versionData: any;
  refetchVersions: () => Promise<any>;
  refetchVersionData: () => Promise<any>;
}

export default function AppVersionDetail({
  app,
  versionData,
  refetchVersions,
  refetchVersionData,
}: AppVersionDetailProps) {
  const navigate = useNavigate();
  const vincentApi = useVincentApiWithSIWE();
  const [enableAppVersion, { isLoading: isEnabling }] = vincentApi.useEnableAppVersionMutation();
  const [disableAppVersion, { isLoading: isDisabling }] = vincentApi.useDisableAppVersionMutation();
  const [statusMessage, setStatusMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);

  useAddressCheck(app);

  const appId = app.appId;
  const versionId = versionData.version;

  const onEnableVersion = () => {
    if (!appId || !versionId) return;

    handleEnableVersion({
      appId,
      versionId,
      enableAppVersion,
      refetchVersionData,
      refetchVersionsList: refetchVersions,
      setStatusMessage,
    });
  };

  const onDisableVersion = () => {
    if (!appId || !versionId) return;

    handleDisableVersion({
      appId,
      versionId,
      disableAppVersion,
      refetchVersionData,
      refetchVersionsList: refetchVersions,
      setStatusMessage,
    });
  };

  const isVersionEnabled = versionData?.enabled ?? false;
  const isProcessing = isEnabling || isDisabling;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Version {versionId}</h1>
          <p className="text-gray-600 mt-2">View and manage this version of your application</p>
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && <StatusMessage message={statusMessage.message} type={statusMessage.type} />}

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
                disabled={isProcessing}
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
                disabled={isProcessing}
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
          </div>
        </div>
      </div>

      {/* Version Details */}
      <VersionDetails
        version={versionId}
        appId={appId}
        appName={app.name}
        versionData={versionData}
      />
    </div>
  );
}
