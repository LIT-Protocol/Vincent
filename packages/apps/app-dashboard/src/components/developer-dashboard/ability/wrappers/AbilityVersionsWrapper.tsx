import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AbilityVersionsListView } from '../views/AbilityVersionsListView';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { AbilityVersion } from '@/types/developer-dashboard/appTypes';

export function AbilityVersionsWrapper() {
  const { packageName } = useParams<{ packageName: string }>();

  // Fetch ability
  const {
    data: ability,
    isLoading: abilityLoading,
    isError: abilityError,
  } = vincentApiClient.useGetAbilityQuery({ packageName: packageName || '' });

  // Fetch
  const {
    data: versions,
    isLoading: versionsLoading,
    isError: versionsError,
  } = vincentApiClient.useGetAbilityVersionsQuery({ packageName: packageName! });

  // Separate active and deleted versions
  const { activeVersions, deletedVersions } = useMemo(() => {
    if (!versions?.length) return { activeVersions: [], deletedVersions: [] };
    const activeVersions = versions.filter((version: AbilityVersion) => !version.isDeleted);
    const deletedVersions = versions.filter((version: AbilityVersion) => version.isDeleted);

    return { activeVersions, deletedVersions };
  }, [versions]);

  // Navigation
  const navigate = useNavigate();

  // Loading states first
  if (abilityLoading || versionsLoading) return <Loading />;

  // Combined error states
  if (abilityError) return <StatusMessage message="Failed to load ability" type="error" />;
  if (versionsError)
    return <StatusMessage message="Failed to load ability versions" type="error" />;
  if (!ability) return <StatusMessage message={`Ability ${packageName} not found`} type="error" />;
  if (!versions) return <StatusMessage message="No ability versions found" type="info" />;

  const handleVersionClick = (version: string) => {
    navigate(`/developer/ability/${encodeURIComponent(packageName!)}/version/${version}`);
  };

  return (
    <AbilityVersionsListView
      activeVersions={activeVersions}
      deletedVersions={deletedVersions}
      ability={ability}
      onVersionClick={handleVersionClick}
    />
  );
}
