import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { AppVersionAbility, Ability } from '@/types/developer-dashboard/appTypes';
import { ManageAppVersionAbilities } from '../views/ManageAppVersionAbilities.tsx';
import { CreateAppVersionAbilitiesForm } from '../forms/CreateAppVersionAbilitiesForm.tsx';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { Button } from '@/components/shared/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function AppVersionAbilitiesWrapper() {
  const { appId, versionId } = useParams<{ appId: string; versionId: string }>();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetching
  const {
    data: app,
    isLoading: appLoading,
    isError: appError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) });

  const {
    data: versionData,
    isLoading: versionLoading,
    isError: versionError,
  } = vincentApiClient.useGetAppVersionQuery({ appId: Number(appId), version: Number(versionId) });

  const {
    data: versionAbilities,
    isLoading: versionAbilitiesLoading,
    isError: versionAbilitiesError,
  } = vincentApiClient.useListAppVersionAbilitiesQuery({
    appId: Number(appId),
    version: Number(versionId),
  });

  // Separate active and deleted abilities
  const { activeAbilities, deletedAbilities } = useMemo(() => {
    if (!versionAbilities?.length) return { activeAbilities: [], deletedAbilities: [] };
    const activeAbilities = versionAbilities.filter(
      (ability: AppVersionAbility) => !ability.isDeleted,
    );
    const deletedAbilities = versionAbilities.filter(
      (ability: AppVersionAbility) => ability.isDeleted,
    );
    return { activeAbilities, deletedAbilities };
  }, [versionAbilities]);

  const {
    data: allAbilities = [],
    isLoading: abilitiesLoading,
    isError: abilitiesError,
  } = vincentApiClient.useListAllAbilitiesQuery();

  // Mutation
  const [createAppVersionAbility, { isLoading, isSuccess, isError, data }] =
    vincentApiClient.useCreateAppVersionAbilityMutation();

  // Effect
  useEffect(() => {
    if (!isSuccess || !data) return;
    setShowSuccess(true);

    const timer = setTimeout(() => {
      setShowSuccess(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isSuccess, data]);

  // Show loading while data is loading OR while checking authorization
  if (appLoading || versionLoading || versionAbilitiesLoading || abilitiesLoading)
    return <Loading />;

  // Handle errors
  if (appError) return <StatusMessage message="Failed to load app" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load version data" type="error" />;
  if (versionAbilitiesError)
    return <StatusMessage message="Failed to load version abilities" type="error" />;
  if (abilitiesError) return <StatusMessage message="Failed to load abilities" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;
  if (!versionData)
    return <StatusMessage message={`Version ${versionId} not found`} type="error" />;

  const existingAbilityNames =
    versionAbilities?.map((ability: AppVersionAbility) => ability.abilityPackageName) || [];

  const handleAbilityAdd = async (ability: Ability) => {
    await createAppVersionAbility({
      appId: Number(appId),
      appVersion: Number(versionId),
      abilityPackageName: ability.packageName,
      appVersionAbilityCreate: {
        abilityVersion: ability.activeVersion,
        hiddenSupportedPolicies: [],
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">
              {app.name} - Version {versionData.version} Abilities
            </h1>
            <p className="text-gray-600 dark:text-white/60 mt-2">
              Manage and configure abilities for this app version
            </p>
          </div>
        </div>
      </div>

      {isLoading && <StatusMessage message="Adding ability..." type="info" />}
      {showSuccess && <StatusMessage message="Ability added successfully!" type="success" />}
      {isError && <StatusMessage message="Failed to add ability" type="error" />}

      {/* Add Abilities Form */}
      <CreateAppVersionAbilitiesForm
        existingAbilities={existingAbilityNames}
        onAbilityAdd={handleAbilityAdd}
        availableAbilities={allAbilities}
      />

      {/* Current Abilities List */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-neutral-800 dark:text-white">
            Current Abilities
          </h3>
          <p className="text-gray-600 dark:text-white/60 text-sm mt-1">
            Abilities currently associated with this version. After adding and editing your
            abilities, you can publish your app version to be accessible by users.
          </p>
        </div>
        <ManageAppVersionAbilities
          abilities={activeAbilities}
          deletedAbilities={deletedAbilities}
          appId={Number(appId)}
          versionId={Number(versionId)}
        />
      </div>

      {activeAbilities.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-neutral-800 dark:text-white">Ready to Publish?</h3>
                <p className="text-gray-600 dark:text-white/70 text-sm">
                  Your app version has {activeAbilities.length} abilit
                  {activeAbilities.length === 1 ? 'y' : 'ies'} configured.
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate(`/developer/appId/${appId}/version/${versionId}`)}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white px-4 py-2 flex items-center gap-2 font-medium"
            >
              Publish App Version
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
