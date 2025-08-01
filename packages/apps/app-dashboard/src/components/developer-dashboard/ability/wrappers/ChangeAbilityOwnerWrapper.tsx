import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import {
  ChangeAbilityOwnerForm,
  ChangeAbilityOwnerFormData,
} from '../forms/ChangeAbilityOwnerForm';
import Loading from '@/components/shared/ui/Loading';

export function ChangeAbilityOwnerWrapper() {
  const { packageName } = useParams<{ packageName: string }>();

  // Fetch
  const {
    data: ability,
    isLoading: abilityLoading,
    isError: abilityError,
  } = vincentApiClient.useGetAbilityQuery({ packageName: packageName || '' });

  // Mutation
  const [changeAbilityOwner, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useChangeAbilityOwnerMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data && ability) {
      navigate(`/developer/abilities`); // Immediate navigation, otherwise query will say ability DNE
    }
  }, [isSuccess, data, navigate, ability]);

  // Loading states
  if (abilityLoading) return <Loading />;

  // Error states
  if (abilityError) return <StatusMessage message="Failed to load ability" type="error" />;
  if (!ability) return <StatusMessage message={`Ability ${packageName} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Updating ability..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Ability updated successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to update ability');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: ChangeAbilityOwnerFormData) => {
    await changeAbilityOwner({
      packageName: ability.packageName,
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
          <h1 className="text-3xl font-bold text-gray-900">Change Ability Owner</h1>
          <p className="text-gray-600 mt-2">Change the owner of this ability</p>
        </div>
      </div>

      <ChangeAbilityOwnerForm onSubmit={handleSubmit} isSubmitting={isLoading} />
    </div>
  );
}
