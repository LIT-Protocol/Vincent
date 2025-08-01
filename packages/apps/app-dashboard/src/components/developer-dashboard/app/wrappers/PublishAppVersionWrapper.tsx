import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { AbilityVersion, PolicyVersion } from '@/types/developer-dashboard/appTypes';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { PublishAppVersionButton } from './ui/PublishAppVersionButton';
import MutationButtonStates, { SkeletonButton } from '@/components/shared/ui/MutationButtonStates';
import { initPkpSigner } from '@/utils/developer-dashboard/initPkpSigner';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';

export function PublishAppVersionWrapper({ isAppPublished }: { isAppPublished: boolean }) {
  const { appId, versionId } = useParams<{ appId: string; versionId: string }>();
  const { authInfo, sessionSigs } = useReadAuthInfo();

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

  // Lazy queries for fetching ability and policy versions
  const [
    triggerGetAbilityVersion,
    { isLoading: abilityVersionsLoading, isError: abilityVersionsError },
  ] = vincentApiClient.useLazyGetAbilityVersionQuery();
  const [triggerGetPolicyVersion, { isLoading: policiesLoading, isError: policiesError }] =
    vincentApiClient.useLazyGetPolicyVersionQuery();

  // State for storing fetched data
  const [abilityVersionsData, setAbilityVersionsData] = useState<Record<string, AbilityVersion>>(
    {},
  );
  const [policyVersionsData, setPolicyVersionsData] = useState<Record<string, PolicyVersion>>({});

  // State for publish status
  const [publishResult, setPublishResult] = useState<{
    success: boolean;
    message?: string;
  } | null>(null);

  // Fetch ability versions and policy versions when activeAbilities changes
  useEffect(() => {
    if (!versionAbilities || versionAbilities.length === 0) {
      setAbilityVersionsData({});
      setPolicyVersionsData({});
      return;
    }

    const fetchAbilityAndPolicyVersions = async () => {
      const abilityVersions: Record<string, AbilityVersion> = {};
      const policyVersions: Record<string, PolicyVersion> = {};

      // Fetch ability versions
      for (const ability of versionAbilities) {
        const abilityVersionResult = await triggerGetAbilityVersion({
          packageName: ability.abilityPackageName,
          version: ability.abilityVersion,
        });

        const abilityKey = `${ability.abilityPackageName}-${ability.abilityVersion}`;
        if (abilityVersionResult.data) {
          abilityVersions[abilityKey] = abilityVersionResult.data;

          // Fetch supported policies for this ability
          if (abilityVersionResult.data.supportedPolicies) {
            for (const [policyPackageName, policyVersion] of Object.entries(
              abilityVersionResult.data.supportedPolicies,
            )) {
              const policyVersionResult = await triggerGetPolicyVersion({
                packageName: policyPackageName,
                version: policyVersion,
              });

              const policyKey = `${policyPackageName}-${policyVersion}`;
              if (policyVersionResult.data) {
                policyVersions[policyKey] = policyVersionResult.data;
              }
            }
          }
        }
      }

      setAbilityVersionsData(abilityVersions);
      setPolicyVersionsData(policyVersions);
    };

    fetchAbilityAndPolicyVersions();
  }, [versionAbilities, triggerGetAbilityVersion, triggerGetPolicyVersion]);

  // Extract IPFS CIDs from the fetched data
  const { abilityIpfsCids, abilityPolicies } = useMemo(() => {
    const abilityIpfsCids: string[] = [];
    const abilityPolicies: string[][] = [];

    // Get ability IPFS CIDs and their corresponding policies
    Object.values(abilityVersionsData).forEach((abilityVersion) => {
      if (abilityVersion.ipfsCid) {
        abilityIpfsCids.push(abilityVersion.ipfsCid);

        // Get policies for this specific ability (or empty array if none)
        const abilityPolicyCids: string[] = [];
        if (abilityVersion.supportedPolicies) {
          Object.entries(abilityVersion.supportedPolicies).forEach(
            ([policyPackageName, policyVersion]) => {
              const policyKey = `${policyPackageName}-${policyVersion}`;
              const policyVersionData = policyVersionsData[policyKey];
              if (policyVersionData?.ipfsCid) {
                abilityPolicyCids.push(policyVersionData.ipfsCid);
              }
            },
          );
        }
        // Always push a policy array for each ability, even if empty
        abilityPolicies.push(abilityPolicyCids);
      }
    });

    return {
      abilityIpfsCids, // Keep all ability CIDs to match policy array length
      abilityPolicies, // Array of policy arrays, one per ability (same length as abilityIpfsCids)
    };
  }, [abilityVersionsData, policyVersionsData]);

  // Clear error message after 3 seconds
  useEffect(() => {
    if (!publishResult || publishResult.success) return;

    const timer = setTimeout(() => {
      setPublishResult(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [publishResult]);

  // Loading states with skeleton
  if (
    appLoading ||
    versionLoading ||
    versionAbilitiesLoading ||
    abilityVersionsLoading ||
    policiesLoading
  ) {
    return <SkeletonButton />;
  }

  // Error states
  if (appError) return <StatusMessage message="Failed to load app" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load version data" type="error" />;
  if (versionAbilitiesError)
    return <StatusMessage message="Failed to load version abilities" type="error" />;
  if (abilityVersionsError)
    return <StatusMessage message="Failed to load ability versions" type="error" />;
  if (policiesError) return <StatusMessage message="Failed to load policy versions" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;
  if (!versionData)
    return <StatusMessage message={`Version ${versionId} not found`} type="error" />;

  const publishAppVersion = async () => {
    if (!appId) {
      return;
    }

    setPublishResult(null);

    try {
      // Check if we have any abilities at all
      if (abilityIpfsCids.length === 0) {
        if (versionAbilities && versionAbilities.length > 0) {
          setPublishResult({
            success: false,
            message:
              'Abilities found but missing IPFS CIDs. Please ensure all abilities are properly uploaded to IPFS.',
          });
        } else {
          setPublishResult({
            success: false,
            message:
              'Cannot publish version without abilities. Please add at least one ability to this version.',
          });
        }
        return;
      }

      // Check if any delegatees are already registered to other apps
      const delegatees = app.delegateeAddresses;

      if (!delegatees) {
        setPublishResult({
          success: false,
          message: 'Cannot publish app without delegatee addresses.',
        });
        return;
      }

      const pkpSigner = await initPkpSigner({ authInfo, sessionSigs });
      const client = getClient({ signer: pkpSigner });

      for (const delegatee of delegatees) {
        try {
          const existingApp = await client.getAppByDelegateeAddress({
            delegateeAddress: delegatee,
          });

          if (existingApp && existingApp?.id !== Number(appId)) {
            setPublishResult({
              success: false,
              message: `Delegatee ${delegatee} is already registered to app ${existingApp?.id}`,
            });
            return;
          }
        } catch (error: any) {
          // If DelegateeNotRegistered, that's fine - continue
          if (!error?.message?.includes('DelegateeNotRegistered')) {
            throw error;
          }
        }
      }

      if (!isAppPublished) {
        // App not registered - use registerApp (first-time registration)
        await client.registerApp({
          appId: Number(appId),
          delegateeAddresses: delegatees,
          versionAbilities: {
            abilityIpfsCids: abilityIpfsCids,
            abilityPolicies: abilityPolicies,
          },
        });
      } else {
        // App is registered - use registerNextVersion
        await client.registerNextVersion({
          appId: Number(appId),
          versionAbilities: {
            abilityIpfsCids: abilityIpfsCids,
            abilityPolicies: abilityPolicies,
          },
        });
      }

      setPublishResult({
        success: true,
        message: 'App version published successfully!',
      });

      // Refresh the page after a short delay to show the success message
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      setPublishResult({
        success: false,
        message: 'Failed to publish app version. Please try again.',
      });
    }
  };

  return (
    <div>
      {publishResult && publishResult.success && (
        <MutationButtonStates type="success" successMessage={publishResult.message || 'Success'} />
      )}
      {publishResult && !publishResult.success && (
        <MutationButtonStates
          type="error"
          errorMessage={publishResult.message || 'Failed to publish'}
        />
      )}
      {!publishResult && <PublishAppVersionButton onSubmit={publishAppVersion} />}
    </div>
  );
}
