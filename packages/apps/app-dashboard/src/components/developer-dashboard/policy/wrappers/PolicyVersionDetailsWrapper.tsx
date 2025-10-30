import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { PolicyVersionDetailsView } from '../views/PolicyVersionDetailsView';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';
import { EditPolicyVersionForm } from '../forms/EditPolicyVersionForm';
import { DeletePolicyVersionForm } from '../forms/DeletePolicyVersionForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { fonts } from '@/components/user-dashboard/connect/ui/theme';

type ViewType = 'details' | 'edit-version' | 'delete-version';

export function PolicyVersionDetailsWrapper() {
  const { packageName, version } = useParams<{ packageName: string; version: string }>();
  const [currentView, setCurrentView] = useState<ViewType>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Fetch all versions (needed for delete form)
  const {
    data: versions,
    isLoading: versionsLoading,
    isError: versionsError,
  } = vincentApiClient.useGetPolicyVersionsQuery({ packageName: packageName || '' });

  // Mutations
  const [editPolicyVersion] = vincentApiClient.useEditPolicyVersionMutation();
  const [deletePolicyVersion] = vincentApiClient.useDeletePolicyVersionMutation();

  // Navigation
  const navigate = useNavigate();

  // Loading states first
  if (policyLoading || versionLoading || versionsLoading) return <Loading />;

  // Combined error states
  if (policyError) return <StatusMessage message="Failed to load policy" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load policy version" type="error" />;
  if (versionsError) return <StatusMessage message="Failed to load versions" type="error" />;
  if (!policy) return <StatusMessage message={`Policy ${packageName} not found`} type="error" />;
  if (!versionData)
    return <StatusMessage message={`Policy version ${version} not found`} type="error" />;
  if (!versions) return <StatusMessage message="Failed to load versions" type="error" />;

  const handleOpenMutation = (mutationType: string) => {
    setCurrentView(mutationType as ViewType);
  };

  const handleEditPolicyVersionSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await editPolicyVersion({
        packageName: packageName!,
        version: version!,
        policyVersionEdit: data,
      }).unwrap();

      setTimeout(() => {
        setCurrentView('details');
        setIsSubmitting(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to update policy version:', error);
      setIsSubmitting(false);
      throw error;
    }
  };

  const handleDeletePolicyVersionSubmit = async () => {
    setIsSubmitting(true);
    try {
      await deletePolicyVersion({ packageName: packageName!, version: version! }).unwrap();
      navigate(`/developer/policies/policy/${encodeURIComponent(packageName!)}/versions`);
    } catch (error) {
      console.error('Failed to delete policy version:', error);
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
          {
            label: policy.title || policy.packageName,
            onClick: () =>
              navigate(`/developer/policies/policy/${encodeURIComponent(packageName!)}`),
          },
          { label: `Version ${version}` },
        ]}
      />
      <PolicyVersionDetailsView
        policy={policy}
        version={versionData}
        onOpenMutation={handleOpenMutation}
      />

      {/* Edit Policy Version Modal */}
      <Dialog open={currentView === 'edit-version'} onOpenChange={handleCloseModal}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
              Edit Policy Version {versionData.version}
            </DialogTitle>
            <DialogDescription>Update the changes description for this version</DialogDescription>
          </DialogHeader>
          <EditPolicyVersionForm
            versionData={versionData}
            onSubmit={handleEditPolicyVersionSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Policy Version Modal */}
      <Dialog open={currentView === 'delete-version'} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
              Delete Policy Version
            </DialogTitle>
          </DialogHeader>
          <DeletePolicyVersionForm
            policy={policy}
            version={version!}
            versions={versions}
            onSubmit={handleDeletePolicyVersionSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
