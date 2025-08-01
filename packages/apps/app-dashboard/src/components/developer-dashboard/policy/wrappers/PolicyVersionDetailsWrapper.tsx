import { useNavigate, useParams } from 'react-router';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { PolicyVersionDetailsView } from '../views/PolicyVersionDetailsView';

export function PolicyVersionDetailsWrapper() {
  const { packageName, version } = useParams<{ packageName: string; version: string }>();

  // Fetch
  const {
    data: policy,
    isLoading: policyLoading,
    isError: policyError,
  } = vincentApiClient.useGetPolicyQuery({ packageName: packageName || '' });

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

  // Loading states first
  if (policyLoading || versionLoading) return <Loading />;

  // Combined error states
  if (policyError) return <StatusMessage message="Failed to load policy" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load policy version" type="error" />;
  if (!policy) return <StatusMessage message={`Policy ${packageName} not found`} type="error" />;
  if (!versionData)
    return <StatusMessage message={`Policy version ${version} not found`} type="error" />;

  const onOpenMutation = (mutationType: string) => {
    navigate(
      `/developer/policy/${encodeURIComponent(packageName!)}/version/${version}/${mutationType}`,
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
