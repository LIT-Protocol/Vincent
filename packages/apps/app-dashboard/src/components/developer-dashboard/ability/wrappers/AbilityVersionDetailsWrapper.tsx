import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { wait } from '@/lib/utils';
import { AbilityVersionDetailsView } from '../views/AbilityVersionDetailsView';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';
import {
  EditAbilityVersionForm,
  EditAbilityVersionFormData,
} from '../forms/EditAbilityVersionForm';
import { DeleteAbilityVersionForm } from '../forms/DeleteAbilityVersionForm';
import { RefreshAbilityVersionPoliciesForm } from '../forms/RefreshAbilityVersionPoliciesForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { fonts } from '@/components/user-dashboard/connect/ui/theme';

type ViewType = 'details' | 'edit-version' | 'delete-version' | 'refresh-policies';

export function AbilityVersionDetailsWrapper() {
  const { packageName, version } = useParams<{ packageName: string; version: string }>();
  const [currentView, setCurrentView] = useState<ViewType>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{
    success: boolean;
    supportedPolicies?: Record<string, string>;
    error?: string;
  } | null>(null);

  // Fetch ability
  const {
    data: ability,
    isLoading: abilityLoading,
    isError: abilityError,
  } = vincentApiClient.useGetAbilityQuery({ packageName: packageName || '' });

  // Fetch version data
  const {
    data: versionData,
    isLoading: versionLoading,
    isError: versionError,
  } = vincentApiClient.useGetAbilityVersionQuery({ packageName: packageName!, version: version! });

  // Fetch all versions (needed for delete form)
  const {
    data: versions,
    isLoading: versionsLoading,
    isError: versionsError,
  } = vincentApiClient.useGetAbilityVersionsQuery({ packageName: packageName || '' });

  // Mutations
  const [editAbilityVersion] = vincentApiClient.useEditAbilityVersionMutation();
  const [deleteAbilityVersion] = vincentApiClient.useDeleteAbilityVersionMutation();
  const [refreshAbilityVersionPolicies] =
    vincentApiClient.useRefreshAbilityVersionPoliciesMutation();

  // Navigation
  const navigate = useNavigate();

  // Loading states first
  if (abilityLoading || versionLoading || versionsLoading) return <Loading />;

  // Combined error states
  if (abilityError) return <StatusMessage message="Failed to load ability" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load ability version" type="error" />;
  if (versionsError) return <StatusMessage message="Failed to load versions" type="error" />;
  if (!ability) return <StatusMessage message={`Ability ${packageName} not found`} type="error" />;
  if (!versionData)
    return <StatusMessage message={`Ability version ${version} not found`} type="error" />;
  if (!versions) return <StatusMessage message="Failed to load versions" type="error" />;

  const handleOpenMutation = (mutationType: string) => {
    setCurrentView(mutationType as ViewType);
  };

  const handleEditAbilityVersionSubmit = async (data: EditAbilityVersionFormData) => {
    setIsSubmitting(true);
    try {
      await editAbilityVersion({
        packageName: packageName!,
        version: version!,
        abilityVersionEdit: data,
      }).unwrap();

      setCurrentView('details');
      setIsSubmitting(false);
    } catch (error) {
      console.error('Failed to update ability version:', error);
      setIsSubmitting(false);
      throw error;
    }
  };

  const handleDeleteAbilityVersionSubmit = async () => {
    setIsSubmitting(true);
    try {
      await deleteAbilityVersion({ packageName: packageName!, version: version! }).unwrap();
      navigate(`/developer/abilities/ability/${encodeURIComponent(packageName!)}/versions`);
    } catch (error) {
      console.error('Failed to delete ability version:', error);
      setIsSubmitting(false);
      throw error;
    }
  };

  const handleRefreshPoliciesSubmit = async () => {
    setIsSubmitting(true);
    setRefreshResult(null);
    try {
      const result = await refreshAbilityVersionPolicies({
        packageName: packageName!,
        version: version!,
      }).unwrap();
      setRefreshResult({
        success: true,
        supportedPolicies: result.supportedPolicies || {},
      });
      setIsSubmitting(false);

      // Wait 2 seconds then close the modal
      await wait(2000);
      setCurrentView('details');
      setRefreshResult(null);
    } catch (error: any) {
      console.error('Failed to refresh policies:', error);
      setRefreshResult({
        success: false,
        error: error?.data?.message || 'Failed to refresh policies',
      });
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setCurrentView('details');
    setRefreshResult(null);
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Abilities', onClick: () => navigate('/developer/abilities') },
          {
            label: ability.title || ability.packageName,
            onClick: () =>
              navigate(`/developer/abilities/ability/${encodeURIComponent(packageName!)}`),
          },
          { label: `Version ${version}` },
        ]}
      />
      <AbilityVersionDetailsView
        ability={ability}
        version={versionData}
        onOpenMutation={handleOpenMutation}
      />

      {/* Edit Ability Version Modal */}
      <Dialog open={currentView === 'edit-version'} onOpenChange={handleCloseModal}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
              Edit Ability Version {versionData.version}
            </DialogTitle>
            <DialogDescription>Update the changes description for this version</DialogDescription>
          </DialogHeader>
          <EditAbilityVersionForm
            versionData={versionData}
            onSubmit={handleEditAbilityVersionSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Ability Version Modal */}
      <Dialog open={currentView === 'delete-version'} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
              Delete Ability Version
            </DialogTitle>
          </DialogHeader>
          <DeleteAbilityVersionForm
            ability={ability}
            version={version!}
            versions={versions}
            onSubmit={handleDeleteAbilityVersionSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Refresh Policies Modal */}
      <Dialog open={currentView === 'refresh-policies'} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
              Refresh Supported Policies
            </DialogTitle>
          </DialogHeader>
          <RefreshAbilityVersionPoliciesForm
            onSubmit={handleRefreshPoliciesSubmit}
            isSubmitting={isSubmitting}
            result={refreshResult}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
