import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { AppVersionTool, Tool } from '@/types/developer-dashboard/appTypes';
import { ManageAppVersionTools } from '../views/ManageAppVersionTools';
import { CreateAppVersionToolsForm } from '../forms/CreateAppVersionToolsForm';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';

export function AppVersionToolsWrapper() {
  const { appId, versionId } = useParams<{ appId: string; versionId: string }>();
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetching
  const {
    data: app,
    isLoading: appLoading,
    isError: appError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) });

  const {
    data: versionData,
    isLoading: versionLoading,
    isError: versionError,
  } = vincentApiClient.useGetAppVersionQuery({ appId: Number(appId), version: Number(versionId) });

  const {
    data: versionTools,
    isLoading: versionToolsLoading,
    isError: versionToolsError,
  } = vincentApiClient.useListAppVersionToolsQuery({
    appId: Number(appId),
    version: Number(versionId),
  });

  // Separate active and deleted tools
  const { activeTools, deletedTools } = useMemo(() => {
    if (!versionTools?.length) return { activeTools: [], deletedTools: [] };
    const activeTools = versionTools.filter((tool: AppVersionTool) => !tool.isDeleted);
    const deletedTools = versionTools.filter((tool: AppVersionTool) => tool.isDeleted);
    return { activeTools, deletedTools };
  }, [versionTools]);

  const {
    data: allTools = [],
    isLoading: toolsLoading,
    isError: toolsError,
  } = vincentApiClient.useListAllToolsQuery();

  // Mutation
  const [createAppVersionTool, { isLoading, isSuccess, isError, data }] =
    vincentApiClient.useCreateAppVersionToolMutation();

  // Effect
  useEffect(() => {
    if (!isSuccess || !data) return;
    setShowSuccess(true);

    const timer = setTimeout(() => {
      setShowSuccess(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isSuccess, data]);

  // Show loading while data is loading OR while checking authorization
  if (appLoading || versionLoading || versionToolsLoading || toolsLoading) return <Loading />;

  // Handle errors
  if (appError) return <StatusMessage message="Failed to load app" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load version data" type="error" />;
  if (versionToolsError)
    return <StatusMessage message="Failed to load version tools" type="error" />;
  if (toolsError) return <StatusMessage message="Failed to load tools" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;
  if (!versionData)
    return <StatusMessage message={`Version ${versionId} not found`} type="error" />;

  const existingToolNames = activeTools?.map((tool: AppVersionTool) => tool.toolPackageName) || [];

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
      {isError && <StatusMessage message="Failed to add tool" type="error" />}

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
          tools={activeTools}
          deletedTools={deletedTools}
          appId={Number(appId)}
          versionId={Number(versionId)}
        />
      </div>
    </div>
  );
}
