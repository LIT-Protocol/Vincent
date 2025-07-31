import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { AbilityInfoView } from '../../ui/AbilityInfoView';
import { AppVersionAbility } from '@/types/developer-dashboard/appTypes';

interface AbilityInfoWrapperProps {
  appVersionAbility: AppVersionAbility;
  abilityPackageName: string;
}

export function AbilityInfoWrapper({
  appVersionAbility,
  abilityPackageName,
}: AbilityInfoWrapperProps) {
  const {
    data: ability,
    isLoading: isLoadingAbilityData,
    isError: isErrorAbilityData,
  } = vincentApiClient.useGetAbilityQuery({
    packageName: abilityPackageName,
  });

  if (isLoadingAbilityData) return <Loading />;
  if (isErrorAbilityData)
    return <StatusMessage message="Failed to load ability data" type="error" />;
  if (!ability) return <StatusMessage message="No ability data found" type="error" />;

  return <AbilityInfoView appVersionAbility={appVersionAbility} ability={ability} />;
}
