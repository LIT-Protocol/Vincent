import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserPolicies } from '@/hooks/developer-dashboard/policy/useUserPolicies';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { sortPolicyFromPolicies } from '@/utils/developer-dashboard/sortPolicyFromPolicies';
import { ChangePolicyOwnerForm, ChangePolicyOwnerFormData } from '../forms/ChangePolicyOwnerForm';
import Loading from '@/components/layout/Loading';
import { useAddressCheck } from '@/hooks/developer-dashboard/tool/useAddressCheck';

export function ChangePolicyOwnerWrapper() {
  const { packageName } = useParams<{ packageName: string }>();

  // Fetching
  // It's not needed here, but we'll fetch to make sure the tool exists
  const { data: policies, isLoading: policiesLoading, isError: policiesError } = useUserPolicies();

  const policy = sortPolicyFromPolicies(policies, packageName);

  // Mutation
  const [changePolicyOwner, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useChangePolicyOwnerMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data && policy) {
      navigate(`/developer/policies`); // Immediate navigation, otherwise query will say policy DNE
    }
  }, [isSuccess, data, policy]);

  useAddressCheck(policy);

  // Loading states
  if (policiesLoading) return <Loading />;

  // Error states
  if (policiesError) return <StatusMessage message="Failed to load policies" type="error" />;
  if (!policy) return <StatusMessage message={`Policy ${packageName} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Updating policy..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Policy updated successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to update policy');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: ChangePolicyOwnerFormData) => {
    await changePolicyOwner({
      packageName: policy.packageName,
      changeOwner: {
        authorWalletAddress: data.authorWalletAddress,
      },
    });
  };

  // Render with page UI and form component
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Change Policy Owner</h1>
          <p className="text-gray-600 mt-2">Change the owner of this policy</p>
        </div>
      </div>

      <ChangePolicyOwnerForm onSubmit={handleSubmit} isSubmitting={isLoading} />
    </div>
  );
}
