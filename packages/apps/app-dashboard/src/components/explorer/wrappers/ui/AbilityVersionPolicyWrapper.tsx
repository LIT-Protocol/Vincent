import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { AppVersionAbility } from '@/types/developer-dashboard/appTypes';
import { sortedSupportedPolicies } from '@/utils/developer-dashboard/sortSupportedPolicies';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { AbilityVersionPoliciesView } from '../../views/AbilityVersionPoliciesView';

interface AbilityVersionPoliciesWrapperProps {
  appAbilityVersion: AppVersionAbility;
}

export function AbilityVersionPoliciesWrapper({
  appAbilityVersion,
}: AbilityVersionPoliciesWrapperProps) {
  const {
    data: abilityVersion,
    isLoading: isLoadingAbilityVersionData,
    isError: isErrorAbilityVersionData,
  } = vincentApiClient.useGetAbilityVersionQuery({
    packageName: appAbilityVersion.abilityPackageName,
    version: appAbilityVersion.abilityVersion,
  });

  const {
    data: allPolicies,
    isLoading: isLoadingPolicies,
    isError: isErrorPolicies,
  } = vincentApiClient.useListAllPoliciesQuery();

  const allSupportedPolicies = abilityVersion
    ? sortedSupportedPolicies(allPolicies || [], abilityVersion)
    : [];

  // Filter out hidden policies for this specific app
  const visibleSupportedPolicies = allSupportedPolicies.filter(
    (policy) => !appAbilityVersion.hiddenSupportedPolicies?.includes(policy.packageName),
  );

  if (isLoadingPolicies || isLoadingAbilityVersionData) return <Loading />;
  if (isErrorPolicies)
    return <StatusMessage message="Failed to load supported policies" type="error" />;
  if (isErrorAbilityVersionData)
    return <StatusMessage message="Failed to load ability version data" type="error" />;
  if (!allPolicies) return <StatusMessage message="No supported policies found" type="error" />;
  if (!abilityVersion)
    return <StatusMessage message="No ability version data found" type="error" />;

  return <AbilityVersionPoliciesView supportedPolicies={visibleSupportedPolicies} />;
}
