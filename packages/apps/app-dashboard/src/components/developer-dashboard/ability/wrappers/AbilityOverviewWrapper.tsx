import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AbilityDetailsView from '../views/AbilityDetailsView';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';
import { EditAbilityForm } from '../forms/EditAbilityForm';
import { DeleteAbilityForm } from '../forms/DeleteAbilityForm';
import { ChangeAbilityOwnerForm } from '../forms/ChangeAbilityOwnerForm';
import { CreateAbilityVersionForm } from '../forms/CreateAbilityVersionForm';
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
  | 'edit-ability'
  | 'delete-ability'
  | 'change-owner'
  | 'create-ability-version';

export function AbilityOverviewWrapper() {
  const { packageName } = useParams<{ packageName: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState<ViewType>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetching
  const {
    data: ability,
    isLoading: abilityLoading,
    isError: abilityError,
  } = vincentApiClient.useGetAbilityQuery({ packageName: packageName || '' });

  const {
    data: activeAbilityVersion,
    isLoading: activeAbilityVersionLoading,
    isError: activeAbilityVersionError,
  } = vincentApiClient.useGetAbilityVersionQuery(
    {
      packageName: packageName || '',
      version: ability?.activeVersion || '',
    },
    { skip: !ability?.activeVersion },
  );

  const {
    data: abilityVersions,
    isLoading: abilityVersionsLoading,
    isError: abilityVersionsError,
  } = vincentApiClient.useGetAbilityVersionsQuery({ packageName: packageName || '' });

  // Mutations
  const [editAbility] = vincentApiClient.useEditAbilityMutation();
  const [deleteAbility] = vincentApiClient.useDeleteAbilityMutation();
  const [changeAbilityOwner] = vincentApiClient.useChangeAbilityOwnerMutation();
  const [createAbilityVersion] = vincentApiClient.useCreateAbilityVersionMutation();

  // Check for action query param when data is ready
  useEffect(() => {
    if (!ability || abilityLoading || activeAbilityVersionLoading || abilityVersionsLoading) {
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
    ability,
    abilityLoading,
    activeAbilityVersionLoading,
    abilityVersionsLoading,
  ]);

  // Show loading while data is loading
  if (abilityLoading || activeAbilityVersionLoading || abilityVersionsLoading) return <Loading />;

  // Handle errors
  if (abilityError || activeAbilityVersionError || abilityVersionsError)
    return <StatusMessage message="Failed to load ability" type="error" />;
  if (!ability) return <StatusMessage message={`Ability ${packageName} not found`} type="error" />;
  if (!activeAbilityVersion)
    return (
      <StatusMessage message={`Ability version ${ability?.activeVersion} not found`} type="error" />
    );
  if (!abilityVersions)
    return <StatusMessage message="Failed to load ability versions" type="error" />;

  const handleOpenMutation = (mutationType: string) => {
    if (mutationType === 'versions') {
      navigate(`/developer/abilities/ability/${encodeURIComponent(packageName!)}/versions`);
    } else {
      setCurrentView(mutationType as ViewType);
    }
  };

  const handleEditAbilitySubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await editAbility({
        packageName: packageName!,
        abilityEdit: data,
      }).unwrap();

      setTimeout(() => {
        setCurrentView('details');
        setIsSubmitting(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to update ability:', error);
      setIsSubmitting(false);
      throw error;
    }
  };

  const handleDeleteAbilitySubmit = async () => {
    setIsSubmitting(true);
    try {
      await deleteAbility({ packageName: packageName! }).unwrap();
      navigate('/developer/abilities');
    } catch (error) {
      console.error('Failed to delete ability:', error);
      setIsSubmitting(false);
      throw error;
    }
  };

  const handleChangeAbilityOwnerSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await changeAbilityOwner({
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
      console.error('Failed to change ability owner:', error);
      setIsSubmitting(false);
      throw error;
    }
  };

  const handleCreateAbilityVersionSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const result = await createAbilityVersion({
        packageName: packageName!,
        version: data.version,
        abilityVersionCreate: {
          changes: data.changes,
        },
      }).unwrap();

      setTimeout(() => {
        navigate(
          `/developer/abilities/ability/${encodeURIComponent(packageName!)}/version/${result.version}`,
        );
        setIsSubmitting(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to create ability version:', error);
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
          { label: 'Abilities', onClick: () => navigate('/developer/abilities') },
          { label: ability.title || ability.packageName },
        ]}
      />
      <AbilityDetailsView
        ability={ability}
        activeVersionData={activeAbilityVersion}
        onOpenMutation={handleOpenMutation}
      />

      {/* Edit Ability Modal */}
      <Dialog open={currentView === 'edit-ability'} onOpenChange={handleCloseModal}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
              Edit Ability
            </DialogTitle>
          </DialogHeader>
          <EditAbilityForm
            abilityData={ability}
            abilityVersions={abilityVersions}
            onSubmit={handleEditAbilitySubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Ability Modal */}
      <Dialog open={currentView === 'delete-ability'} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
              Delete Ability
            </DialogTitle>
          </DialogHeader>
          <DeleteAbilityForm
            abilityPackageName={ability.packageName}
            onSubmit={handleDeleteAbilitySubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Change Owner Modal */}
      <Dialog open={currentView === 'change-owner'} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
              Change Ability Owner
            </DialogTitle>
            <DialogDescription>
              Transfer ownership of this ability to another wallet address
            </DialogDescription>
          </DialogHeader>
          <ChangeAbilityOwnerForm
            onSubmit={handleChangeAbilityOwnerSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Create Ability Version Modal */}
      <Dialog open={currentView === 'create-ability-version'} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={fonts.heading}>
              New Ability Version
            </DialogTitle>
            <DialogDescription>Create a new version of your ability</DialogDescription>
          </DialogHeader>
          <CreateAbilityVersionForm
            ability={ability}
            onSubmit={handleCreateAbilityVersionSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
