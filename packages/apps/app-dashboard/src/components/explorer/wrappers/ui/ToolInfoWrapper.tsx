import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { ToolInfoView } from '../../ui/ToolInfoView';
import { AppVersionTool } from '@/types/developer-dashboard/appTypes';

interface ToolInfoWrapperProps {
  appVersionTool: AppVersionTool;
  toolPackageName: string;
}

export function ToolInfoWrapper({ appVersionTool, toolPackageName }: ToolInfoWrapperProps) {
  const {
    data: tool,
    isLoading: isLoadingToolData,
    isError: isErrorToolData,
  } = vincentApiClient.useGetToolQuery({
    packageName: toolPackageName,
  });

  if (isLoadingToolData) return <Loading />;
  if (isErrorToolData) return <StatusMessage message="Failed to load tool data" type="error" />;
  if (!tool) return <StatusMessage message="No tool data found" type="error" />;

  return <ToolInfoView appVersionTool={appVersionTool} tool={tool} />;
}
