import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ToolVersionsListView } from '../views/ToolVersionsListView';
import { useAddressCheck } from '@/hooks/developer-dashboard/tool/useAddressCheck';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { useUserTools } from '@/hooks/developer-dashboard/tool/useUserTools';
import { sortToolFromTools } from '@/utils/developer-dashboard/sortToolFromTools';
import { ToolVersion } from '@lit-protocol/vincent-registry-sdk/dist/src/generated/vincentApiClientReact';

export function ToolVersionsWrapper() {
  const { packageName } = useParams<{ packageName: string }>();
  const { data: tools, isLoading: toolsLoading, isError: toolsError } = useUserTools();

  const tool = sortToolFromTools(tools, packageName);

  // Fetch
  const {
    data: versions,
    isLoading: versionsLoading,
    isError: versionsError,
  } = vincentApiClient.useGetToolVersionsQuery({ packageName: packageName! });

  // Separate active and deleted versions
  const { activeVersions, deletedVersions } = useMemo(() => {
    if (!versions?.length) return { activeVersions: [], deletedVersions: [] };
    const activeVersions = versions.filter((version: ToolVersion) => !version.isDeleted);
    const deletedVersions = versions.filter((version: ToolVersion) => version.isDeleted);

    return { activeVersions, deletedVersions };
  }, [versions]);

  // Navigation
  const navigate = useNavigate();

  useAddressCheck(tool);

  // Loading states first
  if (toolsLoading || versionsLoading) return <Loading />;

  // Combined error states
  if (toolsError) return <StatusMessage message="Failed to load tools" type="error" />;
  if (versionsError) return <StatusMessage message="Failed to load tool versions" type="error" />;
  if (!tool) return <StatusMessage message={`Tool ${packageName} not found`} type="error" />;
  if (!versions) return <StatusMessage message="No tool versions found" type="info" />;

  const handleVersionClick = (version: string) => {
    navigate(`/developer/toolId/${encodeURIComponent(packageName!)}/version/${version}`);
  };

  return (
    <ToolVersionsListView
      activeVersions={activeVersions}
      deletedVersions={deletedVersions}
      tool={tool}
      onVersionClick={handleVersionClick}
    />
  );
}
