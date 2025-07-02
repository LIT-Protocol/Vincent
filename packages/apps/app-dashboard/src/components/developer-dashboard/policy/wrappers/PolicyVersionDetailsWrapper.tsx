import { useNavigate, useParams } from 'react-router';
import { useAddressCheck } from '@/hooks/developer-dashboard/tool/useAddressCheck';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { PolicyVersionDetailsView } from '../views/PolicyVersionDetailsView';
import { sortPolicyFromPolicies } from '@/utils/developer-dashboard/sortPolicyFromPolicies';
import { useUserPolicies } from '@/hooks/developer-dashboard/policy/useUserPolicies';

export function PolicyVersionDetailsWrapper() {
  const { packageName, version } = useParams<{ packageName: string; version: string }>();
  const { data: policies, isLoading: policiesLoading, isError: policiesError } = useUserPolicies();

  const policy = sortPolicyFromPolicies(policies, packageName);

  // Fetch
  const {
    data: versionData,
    isLoading: versionLoading,
    isError: versionError,
  } = vincentApiClient.useGetPolicyVersionQuery({
    packageName: packageName || '',
    version: version || '',
  });

  // Navigation

  const navigate = useNavigate();

  useAddressCheck(policy);

  // Loading states first
  if (policiesLoading || versionLoading) return <Loading />;

  // Combined error states
  if (policiesError) return <StatusMessage message="Failed to load policies" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load policy version" type="error" />;
  if (!policy) return <StatusMessage message={`Policy ${packageName} not found`} type="error" />;
  if (!versionData)
    return <StatusMessage message={`Policy version ${version} not found`} type="error" />;

  const onOpenMutation = (mutationType: string) => {
    navigate(
      `/developer/policyId/${encodeURIComponent(packageName!)}/version/${version}/${mutationType}`,
    );
  };

  return (
    <PolicyVersionDetailsView
      policy={policy}
      version={versionData}
      onOpenMutation={onOpenMutation}
    />
  );
}
