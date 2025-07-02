import { useNavigate, useParams } from 'react-router-dom';
import ToolDetailsView from '../views/ToolDetailsView';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { sortToolFromTools } from '@/utils/developer-dashboard/sortToolFromTools';
import { useUserTools } from '@/hooks/developer-dashboard/tool/useUserTools';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { useAddressCheck } from '@/hooks/developer-dashboard/tool/useAddressCheck';

export function ToolOverviewWrapper() {
  const { packageName } = useParams<{ packageName: string }>();

  // Fetching
  const { data: tools, isLoading, isError } = useUserTools();

  const tool = sortToolFromTools(tools, packageName);

  const {
    data: activeToolVersion,
    isLoading: activeToolVersionLoading,
    isError: activeToolVersionError,
  } = vincentApiClient.useGetToolVersionQuery({
    packageName: packageName || '',
    version: tool?.activeVersion || '',
  });

  // Navigation
  const navigate = useNavigate();

  useAddressCheck(tool);

  // Loading
  if (isLoading || activeToolVersionLoading) return <Loading />;
  if (isError || activeToolVersionError)
    return <StatusMessage message="Failed to load tools" type="error" />;
  if (!tool) return <StatusMessage message={`Tool ${packageName} not found`} type="error" />;
  if (!activeToolVersion)
    return <StatusMessage message={`Tool version ${tool?.activeVersion} not found`} type="error" />;

  const handleOpenMutation = (mutationType: string) => {
    navigate(`/developer/toolId/${encodeURIComponent(packageName!)}/${mutationType}`);
  };

  return (
    <ToolDetailsView
      tool={tool}
      activeVersionData={activeToolVersion}
      onOpenMutation={handleOpenMutation}
    />
  );
}
