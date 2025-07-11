import { useNavigate } from 'react-router-dom';
import { Edit, Plus, Power, PowerOff, Trash2 } from 'lucide-react';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { PublishAppVersionWrapper } from '../PublishAppVersionWrapper';

interface AppVersionUnpublishedButtonsProps {
  appId: number;
  versionId: number;
  isVersionEnabled: boolean;
  isAppRegistered: boolean;
}

export function AppVersionUnpublishedButtons({
  appId,
  versionId,
  isVersionEnabled,
  isAppRegistered,
}: AppVersionUnpublishedButtonsProps) {
  const navigate = useNavigate();

  // Mutations for enable/disable
  const [enableAppVersion, { isLoading: isEnabling }] =
    vincentApiClient.useEnableAppVersionMutation();
  const [disableAppVersion, { isLoading: isDisabling }] =
    vincentApiClient.useDisableAppVersionMutation();

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

  const isLoading = isEnabling || isDisabling;

  return (
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
        onClick={() => navigate(`/developer/appId/${appId}/version/${versionId}/delete-version`)}
        className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        Delete Version
      </button>

      <PublishAppVersionWrapper isAppRegistered={isAppRegistered} />
    </div>
  );
}
