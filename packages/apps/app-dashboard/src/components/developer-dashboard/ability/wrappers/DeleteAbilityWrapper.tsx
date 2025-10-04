import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DeleteAbilityForm } from '../forms/DeleteAbilityForm';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/shared/ui/Loading';

export function DeleteAbilityWrapper() {
  const { packageName } = useParams<{ packageName: string }>();

  // Fetching
  const {
    data: ability,
    isLoading: abilityLoading,
    isError: abilityError,
  } = vincentApiClient.useGetAbilityQuery({ packageName: packageName || '' });

  // Mutation
  const [deleteAbility, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useDeleteAbilityMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data) {
      navigate('/developer/abilities'); // Navigate immediately, no delay needed
    }
  }, [isSuccess, data, navigate]);

  // Loading states
  if (abilityLoading) return <Loading />;

  // Error states
  if (abilityError) return <StatusMessage message="Failed to load ability" type="error" />;
  if (!ability) return <StatusMessage message={`Ability ${packageName} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Deleting ability..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Ability deleted successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to delete ability');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async () => {
    await deleteAbility({ packageName: ability.packageName });
  };
  return (
    <div className="space-y-6">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Delete Ability</h1>
            <p className="text-gray-600 dark:text-white/60 mt-2">Delete "{ability.title}"?</p>
          </div>
        </div>
      </div>

      <DeleteAbilityForm
        title={ability.title || ''}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
      />
    </div>
  );
}
