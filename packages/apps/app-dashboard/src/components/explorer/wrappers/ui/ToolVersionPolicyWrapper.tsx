import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { AppVersionTool } from '@/types/developer-dashboard/appTypes';
import { sortedSupportedPolicies } from '@/utils/developer-dashboard/sortSupportedPolicies';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { ToolVersionPoliciesView } from '../../views/ToolVersionPoliciesView';

interface ToolVersionPoliciesWrapperProps {
  appToolVersion: AppVersionTool;
}

export function ToolVersionPoliciesWrapper({ appToolVersion }: ToolVersionPoliciesWrapperProps) {
  const {
    data: toolVersion,
    isLoading: isLoadingToolVersionData,
    isError: isErrorToolVersionData,
  } = vincentApiClient.useGetToolVersionQuery({
    packageName: appToolVersion.toolPackageName,
    version: appToolVersion.toolVersion,
  });

  const {
    data: allPolicies,
    isLoading: isLoadingPolicies,
    isError: isErrorPolicies,
  } = vincentApiClient.useListAllPoliciesQuery();

  const allSupportedPolicies = toolVersion
    ? sortedSupportedPolicies(allPolicies || [], toolVersion)
    : [];

  // Filter out hidden policies for this specific app
  const visibleSupportedPolicies = allSupportedPolicies.filter(
    (policy) => !appToolVersion.hiddenSupportedPolicies?.includes(policy.packageName),
  );

  if (isLoadingPolicies || isLoadingToolVersionData) return <Loading />;
  if (isErrorPolicies)
    return <StatusMessage message="Failed to load supported policies" type="error" />;
  if (isErrorToolVersionData)
    return <StatusMessage message="Failed to load tool version data" type="error" />;
  if (!allPolicies) return <StatusMessage message="No supported policies found" type="error" />;
  if (!toolVersion) return <StatusMessage message="No tool version data found" type="error" />;

  return <ToolVersionPoliciesView supportedPolicies={visibleSupportedPolicies} />;
}
