import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PolicyDetailsView from '../views/PolicyDetailsView';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';
import { EditPolicyForm } from '../forms/EditPolicyForm';
import { DeletePolicyForm } from '../forms/DeletePolicyForm';
import { ChangePolicyOwnerForm } from '../forms/ChangePolicyOwnerForm';
import { CreatePolicyVersionForm } from '../forms/CreatePolicyVersionForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { fonts } from '@/components/user-dashboard/connect/ui/theme';

type ViewType =
  | 'details'
  | 'edit-policy'
  | 'delete-policy'
  | 'change-owner'
  | 'create-policy-version';

export function PolicyOverviewWrapper() {
  const { packageName } = useParams<{ packageName: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState<ViewType>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const {
    data: policyVersions,
    isLoading: policyVersionsLoading,
    isError: policyVersionsError,
  } = vincentApiClient.useGetPolicyVersionsQuery({ packageName: packageName || '' });

  // Mutations
  const [editPolicy] = vincentApiClient.useEditPolicyMutation();
  const [deletePolicy] = vincentApiClient.useDeletePolicyMutation();
  const [changePolicyOwner] = vincentApiClient.useChangePolicyOwnerMutation();
  const [createPolicyVersion] = vincentApiClient.useCreatePolicyVersionMutation();

  // Check for action query param when data is ready
  useEffect(() => {
    if (!policy || policyLoading || activePolicyVersionLoading || policyVersionsLoading) {
      return;
    }

    const action = searchParams.get('action');

    if (action) {
      setCurrentView(action as ViewType);

      // Clear the query param immediately
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams, { replace: true });
    }
  }, [
    searchParams,
    setSearchParams,
    policy,
    policyLoading,
    activePolicyVersionLoading,
    policyVersionsLoading,
  ]);

  // Show loading while data is loading
  if (policyLoading || activePolicyVersionLoading || policyVersionsLoading) return <Loading />;

  // Handle errors
  if (policyError || activePolicyVersionError || policyVersionsError)
    return <StatusMessage message="Failed to load policy" type="error" />;
  if (!policy) return <StatusMessage message={`Policy ${packageName} not found`} type="error" />;
  if (!activePolicyVersion)
    return (
      <StatusMessage message={`Policy version ${policy?.activeVersion} not found`} type="error" />
    );
  if (!policyVersions)
    return <StatusMessage message="Failed to load policy versions" type="error" />;

  const handleOpenMutation = (mutationType: string) => {
    if (mutationType === 'versions') {
      navigate(`/developer/policies/policy/${encodeURIComponent(packageName!)}/versions`);
    } else {
      setCurrentView(mutationType as ViewType);
    }
  };

  const handleEditPolicySubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await editPolicy({
        packageName: packageName!,
        policyEdit: data,
      }).unwrap();

      setTimeout(() => {
        setCurrentView('details');
        setIsSubmitting(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to update policy:', error);
      setIsSubmitting(false);
      throw error;
    }
  };

  const handleDeletePolicySubmit = async () => {
    setIsSubmitting(true);
    try {
      await deletePolicy({ packageName: packageName! }).unwrap();
      navigate('/developer/policies');
    } catch (error) {
      console.error('Failed to delete policy:', error);
      setIsSubmitting(false);
      throw error;
    }
  };

  const handleChangePolicyOwnerSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await changePolicyOwner({
        packageName: packageName!,
        changeOwner: {
          authorWalletAddress: data.authorWalletAddress,
        },
      }).unwrap();

      setTimeout(() => {
        setCurrentView('details');
        setIsSubmitting(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to change policy owner:', error);
      setIsSubmitting(false);
      throw error;
    }
  };

  const handleCreatePolicyVersionSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const result = await createPolicyVersion({
        packageName: packageName!,
        version: data.version,
        policyVersionCreate: {
          changes: data.changes,
        },
      }).unwrap();

      setTimeout(() => {
        navigate(
          `/developer/policies/policy/${encodeURIComponent(packageName!)}/version/${result.version}`,
        );
        setIsSubmitting(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to create policy version:', error);
      setIsSubmitting(false);
      throw error;
    }
  };

  const handleCloseModal = () => {
    setCurrentView('details');
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Policies', onClick: () => navigate('/developer/policies') },
          { label: policy.title || policy.packageName },
        ]}
      />
      <PolicyDetailsView
        policy={policy}
        activeVersionData={activePolicyVersion}
        onOpenMutation={handleOpenMutation}
      />

      {/* Edit Policy Modal */}
      <Dialog open={currentView === 'edit-policy'} onOpenChange={handleCloseModal}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
              Edit Policy
            </DialogTitle>
          </DialogHeader>
          <EditPolicyForm
            policyData={policy}
            policyVersions={policyVersions}
            onSubmit={handleEditPolicySubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Policy Modal */}
      <Dialog open={currentView === 'delete-policy'} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
              Delete Policy
            </DialogTitle>
          </DialogHeader>
          <DeletePolicyForm
            policyPackageName={policy.packageName}
            onSubmit={handleDeletePolicySubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Change Owner Modal */}
      <Dialog open={currentView === 'change-owner'} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
              Change Policy Owner
            </DialogTitle>
            <DialogDescription>
              Transfer ownership of this policy to another wallet address
            </DialogDescription>
          </DialogHeader>
          <ChangePolicyOwnerForm
            onSubmit={handleChangePolicyOwnerSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Create Policy Version Modal */}
      <Dialog open={currentView === 'create-policy-version'} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
              New Policy Version
            </DialogTitle>
            <DialogDescription>Create a new version of your policy</DialogDescription>
          </DialogHeader>
          <CreatePolicyVersionForm
            policy={policy}
            onSubmit={handleCreatePolicyVersionSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
