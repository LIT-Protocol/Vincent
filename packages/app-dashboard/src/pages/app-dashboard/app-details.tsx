import { useParams, useNavigate } from 'react-router';
import { useAccount } from 'wagmi';
import { Edit } from 'lucide-react';
import { AppVersionsListView } from '@/components/app-dashboard/AppVersionsListView';
import { VersionDetails } from '@/components/app-dashboard/VersionDetails';
import { AppDetailsView } from '@/components/app-dashboard/AppDetailsView';
import { StatusMessage } from '@/utils/shared/statusMessage';
import Loading from '@/layout/app-dashboard/Loading';
import { AppModal } from '@/components/app-dashboard/AppModal';
import { useViewType, useAppData } from '@/hooks/app-dashboard';
import { AppViewType } from '@/types/app-dashboard/viewTypes';

export function AppDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();

  if (!params.appId || isNaN(parseInt(params.appId))) {
    return <StatusMessage message="App not found" type="error" />;
  }

  const appId = parseInt(params.appId);
  const { viewType, versionId } = useViewType();

  const {
    app,
    appError,
    appLoading,
    versions,
    versionsError,
    versionsLoading,
    versionData,
    versionError,
    versionLoading,
  } = useAppData({ appId, viewType, versionId });

  // Auth and loading checks
  if (!isConnected) {
    navigate('/'); // Redirect to home if not connected, they need to connect.
    return;
  }
  if (appLoading) return <Loading />;

  // Error handling
  if (appError || !app) {
    return <StatusMessage message="App not found" type="error" />;
  }

  if (app.managerAddress.toLowerCase() !== address?.toLowerCase()) {
    return <StatusMessage message="Access denied" type="error" />;
  }

  if (viewType === AppViewType.APP_VERSIONS && versionsError) {
    return <StatusMessage message="Error loading app versions" type="error" />;
  }

  if (viewType === AppViewType.APP_VERSION && versionError) {
    return <StatusMessage message="Error loading version data" type="error" />;
  }

  return (
    <div className="p-6">
      {/* Main Content */}
      {viewType === AppViewType.APP_DETAILS && (
        <AppDetailsView
          selectedApp={app}
          onOpenModal={(modalType: string) => navigate(`/appId/${appId}/${modalType}`)}
        />
      )}

      {viewType === AppViewType.APP_VERSIONS && (
        <AppVersionsListView
          versions={versions || []}
          appName={app.name}
          appId={appId}
          latestVersion={app.activeVersion}
          isLoading={versionsLoading}
          error={versionsError}
        />
      )}

      {viewType === AppViewType.APP_VERSION && versionId && (
        <div className="space-y-6">
          {/* Version Management Card */}
          <div className="bg-white border rounded-lg">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-medium text-gray-900">Version Management</h3>
              <p className="text-gray-600 text-sm mt-1">Manage this specific version</p>
            </div>
            <div className="p-6">
              <button
                onClick={() => navigate(`/appId/${appId}/version/${versionId}/edit`)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit Version
              </button>
            </div>
          </div>

          {/* Version Details */}
          {versionLoading ? (
            <Loading />
          ) : (
            <VersionDetails version={versionId} appName={app.name} versionData={versionData} />
          )}
        </div>
      )}

      {/* Modal */}
      <AppModal
        viewType={viewType}
        versionId={versionId}
        appId={appId}
        app={app}
        onClose={() => navigate(`/appId/${appId}`)}
      />
    </div>
  );
}

export default AppDetail;
