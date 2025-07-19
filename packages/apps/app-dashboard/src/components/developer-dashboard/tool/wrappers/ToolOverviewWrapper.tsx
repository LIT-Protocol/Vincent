import { useNavigate, useParams } from 'react-router-dom';
import ToolDetailsView from '../views/ToolDetailsView';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

export function ToolOverviewWrapper() {
  const { packageName } = useParams<{ packageName: string }>();

  // Fetching
  const {
    data: tool,
    isLoading: toolLoading,
    isError: toolError,
  } = vincentApiClient.useGetToolQuery({ packageName: packageName || '' });

  const {
    data: activeToolVersion,
    isLoading: activeToolVersionLoading,
    isError: activeToolVersionError,
  } = vincentApiClient.useGetToolVersionQuery(
    {
      packageName: packageName || '',
      version: tool?.activeVersion || '',
    },
    { skip: !tool?.activeVersion },
  );

  // Navigation
  const navigate = useNavigate();

  // Show loading while data is loading
  if (toolLoading || activeToolVersionLoading) return <Loading />;

  // Handle errors
  if (toolError || activeToolVersionError)
    return <StatusMessage message="Failed to load tool" type="error" />;
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
