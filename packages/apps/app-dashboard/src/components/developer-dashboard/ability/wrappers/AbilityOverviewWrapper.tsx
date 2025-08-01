import { useNavigate, useParams } from 'react-router-dom';
import AbilityDetailsView from '../views/AbilityDetailsView';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

export function AbilityOverviewWrapper() {
  const { packageName } = useParams<{ packageName: string }>();

  // Fetching
  const {
    data: ability,
    isLoading: abilityLoading,
    isError: abilityError,
  } = vincentApiClient.useGetAbilityQuery({ packageName: packageName || '' });

  const {
    data: activeAbilityVersion,
    isLoading: activeAbilityVersionLoading,
    isError: activeAbilityVersionError,
  } = vincentApiClient.useGetAbilityVersionQuery(
    {
      packageName: packageName || '',
      version: ability?.activeVersion || '',
    },
    { skip: !ability?.activeVersion },
  );

  // Navigation
  const navigate = useNavigate();

  // Show loading while data is loading
  if (abilityLoading || activeAbilityVersionLoading) return <Loading />;

  // Handle errors
  if (abilityError || activeAbilityVersionError)
    return <StatusMessage message="Failed to load ability" type="error" />;
  if (!ability) return <StatusMessage message={`Ability ${packageName} not found`} type="error" />;
  if (!activeAbilityVersion)
    return (
      <StatusMessage message={`Ability version ${ability?.activeVersion} not found`} type="error" />
    );

  const handleOpenMutation = (mutationType: string) => {
    navigate(`/developer/ability/${encodeURIComponent(packageName!)}/${mutationType}`);
  };

  return (
    <AbilityDetailsView
      ability={ability}
      activeVersionData={activeAbilityVersion}
      onOpenMutation={handleOpenMutation}
    />
  );
}
