import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

import { AppVersionAbility, Ability } from '@/types/developer-dashboard/appTypes';
import { ManageAppVersionAbilities } from '../views/ManageAppVersionAbilities.tsx';
import { CreateAppVersionAbilitiesForm } from '../forms/CreateAppVersionAbilitiesForm.tsx';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { Button } from '@/components/shared/ui/button';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

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
    <>
      <Breadcrumb
        items={[
          { label: 'Apps', onClick: () => navigate('/developer/apps') },
          { label: app.name, onClick: () => navigate(`/developer/apps/appId/${appId}`) },
          {
            label: `Version ${versionData.version}`,
            onClick: () => navigate(`/developer/apps/appId/${appId}/version/${versionId}`),
          },
          { label: 'Abilities' },
        ]}
      />

      <div className="space-y-6">
        {/* Add Abilities Form */}
        <CreateAppVersionAbilitiesForm
          existingAbilities={existingAbilityNames}
          onAbilityAdd={handleAbilityAdd}
          availableAbilities={allAbilities}
        />

        {/* Status messages */}
        {isLoading && <StatusMessage message="Adding ability..." type="info" />}
        {showSuccess && <StatusMessage message="Ability added successfully!" type="success" />}
        {isError && <StatusMessage message="Failed to add ability" type="error" />}

        {/* Current Abilities Section */}
        <div
          className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
        >
          <div className={`p-6 border-b ${theme.cardBorder}`}>
            <h3 className={`text-lg font-semibold ${theme.text} mb-1`} style={fonts.heading}>
              Current Abilities
            </h3>
            <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
              Abilities currently associated with this version. After adding and editing your
              abilities, you can publish your app version to be accessible by users.
            </p>
          </div>
          <div className="p-6">
            <ManageAppVersionAbilities
              abilities={activeAbilities}
              deletedAbilities={deletedAbilities}
              appId={Number(appId)}
              versionId={Number(versionId)}
            />
          </div>
        </div>

        {activeAbilities.length > 0 && (
          <div
            className={`${theme.mainCard} border rounded-xl p-6`}
            style={{ borderColor: theme.brandOrange }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  className="h-5 w-5 flex-shrink-0 mt-0.5"
                  style={{ color: theme.brandOrange }}
                />
                <div>
                  <h3 className={`font-semibold ${theme.text}`} style={fonts.heading}>
                    Ready to Publish?
                  </h3>
                  <p className={`text-sm ${theme.textMuted} mt-1`} style={fonts.body}>
                    Your app version has {activeAbilities.length} abilit
                    {activeAbilities.length === 1 ? 'y' : 'ies'} configured.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate(`/developer/apps/appId/${appId}/version/${versionId}`)}
                className="w-full sm:w-auto text-white"
                style={{ backgroundColor: theme.brandOrange }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.brandOrange;
                }}
              >
                Publish App Version
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
