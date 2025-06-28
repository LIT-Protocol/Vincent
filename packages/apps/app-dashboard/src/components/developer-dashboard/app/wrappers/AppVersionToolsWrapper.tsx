import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUserApps } from '@/hooks/developer-dashboard/useUserApps';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { AppVersionTool, Tool } from '@/types/developer-dashboard/appTypes';
import { ManageAppVersionTools } from '../views/ManageAppVersionTools';
import { CreateAppVersionToolsForm } from '../forms/CreateAppVersionToolsForm';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import { sortAppFromApps } from '@/utils/developer-dashboard/sortAppFromApps';

export function AppVersionToolsWrapper() {
  const { appId, versionId } = useParams<{ appId: string; versionId: string }>();
  const vincentApi = useVincentApiWithSIWE();
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetching
  const { data: apps, isLoading: appsLoading, isError: appsError } = useUserApps();

  const app = sortAppFromApps(apps, appId);

  const {
    data: versionData,
    isLoading: versionLoading,
    isError: versionError,
  } = vincentApiClient.useGetAppVersionQuery({ appId: Number(appId), version: Number(versionId) });

  const {
    data: versionTools,
    isLoading: versionToolsLoading,
    isError: versionToolsError,
    refetch: refetchVersionTools,
  } = vincentApiClient.useListAppVersionToolsQuery({
    appId: Number(appId),
    version: Number(versionId),
  });

  const {
    data: allTools = [],
    isLoading: toolsLoading,
    isError: toolsError,
  } = vincentApiClient.useListAllToolsQuery();

  // Mutation
  const [createAppVersionTool, { isLoading, isSuccess, isError, data, error }] =
    vincentApi.useCreateAppVersionToolMutation();

  // Effect
  useEffect(() => {
    if (!isSuccess || !data) return;

    refetchVersionTools();
    setShowSuccess(true);

    const timer = setTimeout(() => {
      setShowSuccess(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isSuccess, data, refetchVersionTools]);

  useAddressCheck(app);

  // Loading states
  if (appsLoading || versionLoading || versionToolsLoading || toolsLoading) return <Loading />;

  // Error states
  if (appsError) return <StatusMessage message="Failed to load apps" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load version data" type="error" />;
  if (versionToolsError)
    return <StatusMessage message="Failed to load version tools" type="error" />;
  if (toolsError) return <StatusMessage message="Failed to load tools" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;
  if (!versionData)
    return <StatusMessage message={`Version ${versionId} not found`} type="error" />;

  const existingToolNames = versionTools?.map((tool: AppVersionTool) => tool.toolPackageName) || [];

  const handleToolAdd = async (tool: Tool) => {
    await createAppVersionTool({
      appId: Number(appId),
      appVersion: Number(versionId),
      toolPackageName: tool.packageName,
      appVersionToolCreate: {
        toolVersion: tool.activeVersion,
        hiddenSupportedPolicies: [],
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {app.name} - Version {versionData.version} Tools
          </h1>
          <p className="text-gray-600 mt-2">Manage and configure tools for this app version</p>
        </div>
      </div>

      {isLoading && <StatusMessage message="Adding tool..." type="info" />}
      {showSuccess && <StatusMessage message="Tool added successfully!" type="success" />}
      {isError && error && (
        <StatusMessage message={getErrorMessage(error, 'Failed to add tool')} type="error" />
      )}

      {/* Add Tools Form */}
      <CreateAppVersionToolsForm
        versionId={Number(versionId)}
        existingTools={existingToolNames}
        onToolAdd={handleToolAdd}
        availableTools={allTools}
      />

      {/* Current Tools List */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Current Tools</h3>
          <p className="text-gray-600 text-sm mt-1">
            Tools currently associated with this version. Click the edit button to modify settings
            inline.
          </p>
        </div>
        <ManageAppVersionTools
          tools={versionTools || []}
          appId={Number(appId)}
          versionId={Number(versionId)}
          onEditSuccess={refetchVersionTools}
        />
      </div>
    </div>
  );
}
