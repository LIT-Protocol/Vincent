import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import { ChangeToolOwnerForm, ChangeToolOwnerFormData } from '../forms/ChangeToolOwnerForm';
import Loading from '@/components/layout/Loading';
import { useAddressCheck } from '@/hooks/developer-dashboard/tool/useAddressCheck';

export function ChangeToolOwnerWrapper() {
  const { packageName } = useParams<{ packageName: string }>();

  // Fetch
  const {
    data: tool,
    isLoading: toolLoading,
    isError: toolError,
  } = vincentApiClient.useGetToolQuery({ packageName: packageName || '' });

  // Mutation
  const [changeToolOwner, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useChangeToolOwnerMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data && tool) {
      navigate(`/developer/tools`); // Immediate navigation, otherwise query will say tool DNE
    }
  }, [isSuccess, data, navigate, tool]);

  useAddressCheck(tool || null);

  // Loading states
  if (toolLoading) return <Loading />;

  // Error states
  if (toolError) return <StatusMessage message="Failed to load tool" type="error" />;
  if (!tool) return <StatusMessage message={`Tool ${packageName} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Updating tool..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Tool updated successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to update tool');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: ChangeToolOwnerFormData) => {
    await changeToolOwner({
      packageName: tool.packageName,
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
          <h1 className="text-3xl font-bold text-gray-900">Change Tool Owner</h1>
          <p className="text-gray-600 mt-2">Change the owner of this tool</p>
        </div>
      </div>

      <ChangeToolOwnerForm onSubmit={handleSubmit} isSubmitting={isLoading} />
    </div>
  );
}
