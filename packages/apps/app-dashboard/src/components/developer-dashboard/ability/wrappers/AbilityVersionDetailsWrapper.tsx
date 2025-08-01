import { useNavigate, useParams } from 'react-router';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { AbilityVersionDetailsView } from '../views/AbilityVersionDetailsView';

export function AbilityVersionDetailsWrapper() {
  const { packageName, version } = useParams<{ packageName: string; version: string }>();

  // Fetch ability
  const {
    data: ability,
    isLoading: abilityLoading,
    isError: abilityError,
  } = vincentApiClient.useGetAbilityQuery({ packageName: packageName || '' });

  // Fetch
  const {
    data: versionData,
    isLoading: versionLoading,
    isError: versionError,
  } = vincentApiClient.useGetAbilityVersionQuery({ packageName: packageName!, version: version! });

  // Navigation

  const navigate = useNavigate();

  // Loading states first
  if (abilityLoading || versionLoading) return <Loading />;

  // Combined error states
  if (abilityError) return <StatusMessage message="Failed to load ability" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load ability version" type="error" />;
  if (!ability) return <StatusMessage message={`Ability ${packageName} not found`} type="error" />;
  if (!versionData)
    return <StatusMessage message={`Ability version ${version} not found`} type="error" />;

  const onOpenMutation = (mutationType: string) => {
    navigate(
      `/developer/ability/${encodeURIComponent(packageName!)}/version/${version}/${mutationType}`,
    );
  };

  return (
    <AbilityVersionDetailsView
      ability={ability}
      version={versionData}
      onOpenMutation={onOpenMutation}
    />
  );
}
