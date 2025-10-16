import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserPolicies } from '@/hooks/developer-dashboard/policy/useUserPolicies';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { PolicyListView } from '../views/PolicyListView';
import { CreatePolicyForm, type CreatePolicyFormData } from '../forms/CreatePolicyForm';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shared/ui/dialog';
import { fonts } from '@/components/user-dashboard/connect/ui/theme';

export function PoliciesWrapper() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreating, setIsCreating] = useState(false);

  const {
    data: policies,
    deletedPolicies,
    isLoading: policiesLoading,
    isError: policiesError,
  } = useUserPolicies();

  const [createPolicy] = vincentApiClient.useCreatePolicyMutation();

  // Check if we should open the create modal from URL
  const showCreateModal = searchParams.get('action') === 'create-policy';

  // Loading states first
  if (policiesLoading) return <Loading />;

  // Combined error states
  if (policiesError) return <StatusMessage message="Failed to load policies" type="error" />;

  const handleOpenCreateModal = () => {
    setSearchParams({ action: 'create-policy' });
  };

  const handleCloseCreateModal = () => {
    setSearchParams({});
  };

  const handleCreatePolicy = async (data: CreatePolicyFormData) => {
    const { packageName, ...policyCreateData } = data;
    setIsCreating(true);
    try {
      const result = await createPolicy({
        packageName,
        policyCreate: { ...policyCreateData },
      }).unwrap();

      setTimeout(() => {
        handleCloseCreateModal();
        navigate(`/developer/policies/policy/${encodeURIComponent(result.packageName)}`);
      }, 1500);
    } catch (error) {
      setIsCreating(false);
      throw error;
    }
  };

  return (
    <>
      <PolicyListView
        policies={policies}
        deletedPolicies={deletedPolicies}
        onCreatePolicy={handleOpenCreateModal}
      />

      {/* Create Policy Modal */}
      <Dialog open={showCreateModal} onOpenChange={handleCloseCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
              Create New Policy
            </DialogTitle>
          </DialogHeader>
          <CreatePolicyForm onSubmit={handleCreatePolicy} isSubmitting={isCreating} />
        </DialogContent>
      </Dialog>
    </>
  );
}
