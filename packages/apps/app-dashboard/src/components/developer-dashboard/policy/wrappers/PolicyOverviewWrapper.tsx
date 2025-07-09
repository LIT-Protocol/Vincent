import { useNavigate, useParams } from 'react-router-dom';
import PolicyDetailsView from '../views/PolicyDetailsView';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { useAddressCheck } from '@/hooks/developer-dashboard/tool/useAddressCheck';

export function PolicyOverviewWrapper() {
  const { packageName } = useParams<{ packageName: string }>();

  // Fetch
  const {
    data: policy,
    isLoading: policyLoading,
    isError: policyError,
  } = vincentApiClient.useGetPolicyQuery({ packageName: packageName || '' });

  const {
    data: activePolicyVersion,
    isLoading: activePolicyVersionLoading,
    isError: activePolicyVersionError,
  } = vincentApiClient.useGetPolicyVersionQuery(
    {
      packageName: packageName || '',
      version: policy?.activeVersion || '',
    },
    { skip: !policy?.activeVersion },
  );

  // Navigation
  const navigate = useNavigate();

  useAddressCheck(policy || null);

  // Loading
  if (policyLoading || activePolicyVersionLoading) return <Loading />;
  if (policyError || activePolicyVersionError)
    return <StatusMessage message="Failed to load policy" type="error" />;
  if (!policy) return <StatusMessage message={`Policy ${packageName} not found`} type="error" />;
  if (!activePolicyVersion)
    return (
      <StatusMessage message={`Policy version ${policy?.activeVersion} not found`} type="error" />
    );

  const handleOpenMutation = (mutationType: string) => {
    navigate(`/developer/policyId/${encodeURIComponent(packageName!)}/${mutationType}`);
  };

  return (
    <PolicyDetailsView
      policy={policy}
      activeVersionData={activePolicyVersion}
      onOpenMutation={handleOpenMutation}
    />
  );
}
