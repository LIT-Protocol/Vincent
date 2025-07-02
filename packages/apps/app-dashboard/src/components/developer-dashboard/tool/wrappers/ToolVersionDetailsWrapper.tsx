import { useNavigate, useParams } from 'react-router';
import { useAddressCheck } from '@/hooks/developer-dashboard/tool/useAddressCheck';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { useUserTools } from '@/hooks/developer-dashboard/tool/useUserTools';
import { sortToolFromTools } from '@/utils/developer-dashboard/sortToolFromTools';
import { ToolVersionDetailsView } from '../views/ToolVersionDetailsView';

export function ToolVersionDetailsWrapper() {
  const { packageName, version } = useParams<{ packageName: string; version: string }>();
  const { data: tools, isLoading: toolsLoading, isError: toolsError } = useUserTools();

  const tool = sortToolFromTools(tools, packageName);

  // Fetch
  const {
    data: versionData,
    isLoading: versionLoading,
    isError: versionError,
  } = vincentApiClient.useGetToolVersionQuery({ packageName: packageName!, version: version! });

  // Navigation

  const navigate = useNavigate();

  useAddressCheck(tool);

  // Loading states first
  if (toolsLoading || versionLoading) return <Loading />;

  // Combined error states
  if (toolsError) return <StatusMessage message="Failed to load tools" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load tool version" type="error" />;
  if (!tool) return <StatusMessage message={`Tool ${packageName} not found`} type="error" />;
  if (!versionData)
    return <StatusMessage message={`Tool version ${version} not found`} type="error" />;

  const onOpenMutation = (mutationType: string) => {
    navigate(
      `/developer/toolId/${encodeURIComponent(packageName!)}/version/${version}/${mutationType}`,
    );
  };

  return (
    <ToolVersionDetailsView tool={tool} version={versionData} onOpenMutation={onOpenMutation} />
  );
}
