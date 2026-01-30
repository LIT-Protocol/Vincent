import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import Loading from '@/components/shared/ui/Loading';
import { Button } from '@/components/shared/ui/button';
import { Trash2 } from 'lucide-react';
import { theme, fonts } from '@/lib/themeClasses';
import { registryUrl } from '@/config/registry';
import { getSiweAuthToken } from '@/hooks/developer-dashboard/useAuth';
import { useWagmiSigner } from '@/hooks/developer-dashboard/useWagmiSigner';
import { useEnsureChain } from '@/hooks/developer-dashboard/useEnsureChain';
import { AbilitySelectorModal } from '@/components/developer-dashboard/ui/AbilitySelectorModal';
import { Ability } from '@/types/developer-dashboard/appTypes';

type CreateVersionStep = 'abilities' | 'review' | 'submitting';

interface SelectedAbility {
  ability: Ability;
  ipfsCid: string;
  policies: string[]; // Policy IPFS CIDs
}

export function CreateAppVersionWrapper() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const { getSigner } = useWagmiSigner();
  const { ensureChain, infoMessage } = useEnsureChain();

  const [currentStep, setCurrentStep] = useState<CreateVersionStep>('abilities');
  const [selectedAbilities, setSelectedAbilities] = useState<Map<string, SelectedAbility>>(
    new Map(),
  );
  const [isAbilitySelectorOpen, setIsAbilitySelectorOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<
    'signing' | 'confirming' | 'creating-registry' | null
  >(null);

  // RTK Query mutations
  const [createAppVersionAbility] = vincentApiClient.useCreateAppVersionAbilityMutation();

  // Fetch app data
  const {
    data: app,
    isLoading: appLoading,
    error: appError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) }, { skip: !appId });

  // Fetch app versions to determine next version number
  const {
    data: versions,
    isLoading: versionsLoading,
    error: versionsError,
  } = vincentApiClient.useGetAppVersionsQuery({ appId: Number(appId) }, { skip: !appId });

  // Fetch available abilities
  const {
    data: abilities,
    isLoading: abilitiesLoading,
    error: abilitiesError,
  } = vincentApiClient.useListAllAbilitiesQuery();

  const isLoading = appLoading || versionsLoading;

  // Calculate next version number
  const currentMaxVersion = versions?.length ? Math.max(...versions.map((v: any) => v.version)) : 0;
  const nextVersion = currentMaxVersion + 1;

  const handleAbilityAdd = async (ability: Ability) => {
    try {
      // Get the active version's IPFS CID
      const activeVersion = ability.activeVersion;
      if (!activeVersion) {
        console.error('Ability has no active version:', ability);
        setError('Selected ability has no active version');
        return;
      }

      // Fetch ability version to get IPFS CID
      const encodedPackageName = encodeURIComponent(ability.packageName);
      const encodedVersion = encodeURIComponent(activeVersion);
      const response = await fetch(
        `${registryUrl}/ability/${encodedPackageName}/version/${encodedVersion}`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch ability version: ${response.status} ${response.statusText}`,
        );
      }

      const abilityVersion = await response.json();

      if (!abilityVersion.ipfsCid) {
        throw new Error('Ability version is missing IPFS CID');
      }

      setSelectedAbilities((prev) => {
        const next = new Map(prev);
        next.set(ability.packageName, {
          ability,
          ipfsCid: abilityVersion.ipfsCid,
          policies: [], // TODO: Add policy selection
        });
        return next;
      });
      setError(null);
    } catch (err) {
      console.error('Failed to add ability:', err);
      setError(err instanceof Error ? err.message : 'Failed to add ability');
    }
  };

  const handleAbilityRemove = (packageName: string) => {
    setSelectedAbilities((prev) => {
      const next = new Map(prev);
      next.delete(packageName);
      return next;
    });
  };

  const handleNext = () => {
    setError(null);
    if (currentStep === 'abilities') {
      if (selectedAbilities.size === 0) {
        setError('Please select at least one ability');
        return;
      }
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep === 'review') {
      setCurrentStep('abilities');
    }
  };

  const handleFinalSubmit = async () => {
    // Step 1: Ensure user is on Base Sepolia (before starting submission)
    try {
      const canProceed = await ensureChain('Register Version On-Chain');
      if (!canProceed) return; // Chain was switched, user needs to click again
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to switch network');
      return;
    }

    setCurrentStep('submitting');
    setSubmissionStatus('signing');
    setError(null);

    try {
      // Step 2: Register version on-chain
      console.log('[CreateVersion] Getting signer...');
      const signer = await getSigner();
      const client = getClient({ signer });

      const abilityIpfsCids = Array.from(selectedAbilities.values()).map((sa) => sa.ipfsCid);
      const abilityPolicies = Array.from(selectedAbilities.values()).map((sa) => sa.policies);

      console.log('[CreateVersion] Registering next version with abilities:', abilityIpfsCids);

      setSubmissionStatus('confirming');
      const result = await client.registerNextVersion({
        appId: Number(appId),
        versionAbilities: {
          abilityIpfsCids,
          abilityPolicies,
        },
      });

      console.log('[CreateVersion] Version registered, tx hash:', result.txHash);

      // Step 3: Wait for indexing
      console.log('[CreateVersion] Waiting 5 seconds for indexing...');
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Step 4: Create AppVersion in registry
      setSubmissionStatus('creating-registry');
      console.log('[CreateVersion] Creating AppVersion in registry...');

      const siweToken = getSiweAuthToken();
      if (!siweToken) {
        throw new Error('Authentication required. Please sign in again.');
      }

      const versionResponse = await fetch(`${registryUrl}/app/${appId}/version`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `SIWE ${siweToken}`,
        },
      });

      if (!versionResponse.ok) {
        const errorData = await versionResponse.json();
        throw new Error(errorData.message || 'Failed to create app version in registry');
      }

      const newVersionData = await versionResponse.json();
      const newVersionNumber = newVersionData.version;
      console.log('[CreateVersion] AppVersion created:', newVersionNumber);

      // Step 5: Create AppVersionAbility records in registry
      console.log('[CreateVersion] Creating AppVersionAbility records...');
      try {
        const abilityCreationPromises = Array.from(selectedAbilities.values()).map(
          ({ ability }) => {
            console.log(
              '[CreateVersion] Creating ability:',
              ability.packageName,
              'v',
              ability.activeVersion,
            );
            return createAppVersionAbility({
              appId: Number(appId),
              appVersion: newVersionNumber,
              abilityPackageName: ability.packageName,
              appVersionAbilityCreate: {
                abilityVersion: ability.activeVersion,
                hiddenSupportedPolicies: [],
              },
            }).unwrap();
          },
        );

        await Promise.all(abilityCreationPromises);
        console.log('[CreateVersion] All AppVersionAbility records created');
      } catch (abilityError: any) {
        console.error('[CreateVersion] Failed to create abilities in registry:', abilityError);
        // Navigate to app overview - user can add abilities manually if needed
      }

      // Step 6: Navigate to app detail page
      console.log('[CreateVersion] Success! Navigating to app detail page');
      navigate(`/developer/apps/appId/${appId}`);
    } catch (err: any) {
      console.error('Failed to create app version:', err);

      let errorMessage = 'Failed to create app version';
      if (err.code === 'ACTION_REJECTED' || err.message?.includes('user rejected')) {
        errorMessage =
          'Transaction was rejected. Please try again and approve the transaction in your wallet.';
      } else if (err.code === 'INSUFFICIENT_FUNDS') {
        errorMessage =
          'Insufficient funds to complete the transaction. Please add more ETH to your wallet.';
      } else if (err.message) {
        const match = err.message.match(/^([^(]+)/);
        errorMessage = match ? match[1].trim() : err.message.substring(0, 100);
      }

      setError(errorMessage);
      setCurrentStep('review');
      setSubmissionStatus(null);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (appError || versionsError || abilitiesError || !app) {
    return <StatusMessage message="Failed to load app data" type="error" />;
  }

  // Progress bar data
  const steps = [
    { name: 'Select Abilities', step: 'abilities' },
    { name: 'Review & Submit', step: 'review' },
    { name: 'Register', step: 'submitting' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.step === currentStep);

  // Submitting state
  if (currentStep === 'submitting') {
    return (
      <>
        <Breadcrumb
          items={[
            { label: 'Apps', onClick: () => navigate('/developer/apps') },
            { label: app.name, onClick: () => navigate(`/developer/apps/appId/${appId}`) },
            { label: `New Version (v${nextVersion})` },
          ]}
        />
        <Loading />
        <div className="text-center mt-4">
          {submissionStatus === 'signing' ? (
            <>
              <p className={`text-lg font-semibold ${theme.text} mb-2`} style={fonts.heading}>
                Please sign the transaction
              </p>
              <p className={`${theme.textMuted} text-sm`} style={fonts.body}>
                Check your wallet to approve the version registration transaction
              </p>
            </>
          ) : submissionStatus === 'confirming' ? (
            <>
              <p className={`text-lg font-semibold ${theme.text} mb-2`} style={fonts.heading}>
                Waiting for confirmation
              </p>
              <p className={`${theme.textMuted} text-sm`} style={fonts.body}>
                Your transaction has been submitted and is being confirmed on-chain
              </p>
              <p className={`${theme.textMuted} text-xs mt-2`} style={fonts.body}>
                This typically takes 15-30 seconds
              </p>
            </>
          ) : submissionStatus === 'creating-registry' ? (
            <>
              <p className={`text-lg font-semibold ${theme.text} mb-2`} style={fonts.heading}>
                Creating registry records
              </p>
              <p className={`${theme.textMuted} text-sm`} style={fonts.body}>
                Adding version and abilities to the Vincent Registry
              </p>
              <p className={`${theme.textMuted} text-xs mt-2`} style={fonts.body}>
                Almost done...
              </p>
            </>
          ) : null}
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Apps', onClick: () => navigate('/developer/apps') },
          { label: app.name, onClick: () => navigate(`/developer/apps/appId/${appId}`) },
          { label: `New Version (v${nextVersion})` },
        ]}
      />

      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${theme.text}`}>Create Version {nextVersion}</h1>
        <p className={`${theme.textMuted} mt-2`}>
          Follow the steps below to register a new version for {app.name}.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          {steps.map((step, index) => (
            <div
              key={step.step}
              className="flex items-center"
              style={{ flex: index === steps.length - 1 ? '0 0 auto' : 1 }}
            >
              {/* Step Circle and Label */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 text-white shadow-lg ${
                    index > currentStepIndex
                      ? `${theme.mainCard} border-2 ${theme.cardBorder} ${theme.textMuted}`
                      : ''
                  }`}
                  style={index <= currentStepIndex ? { backgroundColor: theme.brandOrange } : {}}
                >
                  {index + 1}
                </div>
                <span
                  className={`text-xs mt-2 font-medium transition-colors duration-300 text-center`}
                  style={{
                    ...fonts.body,
                    color: index <= currentStepIndex ? theme.text : theme.textMuted,
                  }}
                >
                  {step.name}
                </span>
              </div>

              {/* Connecting Bar */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4" style={{ marginTop: '-20px' }}>
                  <div
                    className="h-1 rounded-full transition-all duration-500"
                    style={{
                      backgroundColor:
                        index < currentStepIndex ? theme.brandOrange : theme.cardBorder,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {infoMessage && (
        <div className="mb-4">
          <StatusMessage message={infoMessage} type="info" />
        </div>
      )}

      {error && (
        <div className="mb-4">
          <StatusMessage message={error} type="error" />
        </div>
      )}

      {/* Step 1: Select Abilities */}
      {currentStep === 'abilities' && (
        <>
          {abilitiesLoading ? (
            <Loading />
          ) : !abilities || abilities.length === 0 ? (
            <StatusMessage message="No abilities available." type="warning" />
          ) : (
            <>
              <Button
                type="button"
                onClick={() => setIsAbilitySelectorOpen(true)}
                className="mb-4"
                style={{ backgroundColor: theme.brandOrange }}
              >
                Add Ability
              </Button>

              {/* Display Selected Abilities */}
              {selectedAbilities.size > 0 && (
                <div
                  className={`mt-6 ${theme.mainCard} border ${theme.mainCardBorder} rounded-xl p-6`}
                >
                  <h3 className={`text-lg font-semibold mb-4 ${theme.text}`} style={fonts.heading}>
                    Selected Abilities ({selectedAbilities.size})
                  </h3>
                  <div className="space-y-2">
                    {Array.from(selectedAbilities.values()).map(({ ability }) => (
                      <div
                        key={ability.packageName}
                        className={`flex items-center justify-between p-3 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}
                      >
                        <div>
                          <div className={`font-semibold ${theme.text}`} style={fonts.body}>
                            {ability.title}
                          </div>
                          <a
                            href={`https://www.npmjs.com/package/${ability.packageName}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm hover:underline"
                            style={{ ...fonts.body, color: theme.brandOrange }}
                          >
                            {ability.packageName} v{ability.activeVersion}
                          </a>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAbilityRemove(ability.packageName)}
                          className="hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleNext}
                  disabled={selectedAbilities.size === 0}
                  className="text-white px-8"
                  style={{ backgroundColor: theme.brandOrange }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.brandOrange;
                  }}
                >
                  Next: Review & Submit
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {/* Step 2: Review */}
      {currentStep === 'review' && (
        <>
          <div className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl p-6 mb-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme.text}`} style={fonts.heading}>
              Review Version {nextVersion}
            </h3>

            {/* Selected Abilities */}
            <div>
              <h4 className={`text-sm font-semibold mb-2 ${theme.text}`} style={fonts.heading}>
                Selected Abilities ({selectedAbilities.size})
              </h4>
              <div className="space-y-2">
                {Array.from(selectedAbilities.values()).map(({ ability }) => (
                  <div
                    key={ability.packageName}
                    className={`p-3 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}
                  >
                    <div className={`font-semibold ${theme.text}`} style={fonts.body}>
                      {ability.title}
                    </div>
                    <div className={`text-sm ${theme.textMuted}`} style={fonts.body}>
                      {ability.packageName} v{ability.activeVersion}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <Button onClick={handleBack} variant="outline">
              Back
            </Button>
            <Button
              onClick={handleFinalSubmit}
              className="text-white px-8"
              style={{ backgroundColor: theme.brandOrange }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.brandOrange;
              }}
            >
              Register Version On-Chain
            </Button>
          </div>
        </>
      )}

      {/* Ability Selector Modal */}
      <AbilitySelectorModal
        isOpen={isAbilitySelectorOpen}
        onClose={() => setIsAbilitySelectorOpen(false)}
        onAbilityAdd={handleAbilityAdd}
        existingAbilities={Array.from(selectedAbilities.keys())}
        availableAbilities={abilities || []}
      />
    </>
  );
}
