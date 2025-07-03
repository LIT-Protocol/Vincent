import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { ToolVersion } from '@/types/developer-dashboard/appTypes';
import { sortedSupportedPolicies } from '@/utils/developer-dashboard/sortSupportedPolicies';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { ToolVersionInfoView } from '../../views/ToolVersionInfoView';

interface ToolVersionInfoWrapperProps {
  toolVersion: ToolVersion;
}

export function ToolVersionInfoWrapper({ toolVersion }: ToolVersionInfoWrapperProps) {
  const {
    data: allPolicies,
    isLoading: isLoadingPolicies,
    isError: isErrorPolicies,
  } = vincentApiClient.useListAllPoliciesQuery();

  const supportedPolicies = sortedSupportedPolicies(allPolicies || [], toolVersion);

  if (isLoadingPolicies) return <Loading />;
  if (isErrorPolicies)
    return <StatusMessage message="Failed to load supported policies" type="error" />;
  if (!allPolicies) return <StatusMessage message="No supported policies found" type="error" />;

  return <ToolVersionInfoView supportedPolicies={supportedPolicies} />;
}
