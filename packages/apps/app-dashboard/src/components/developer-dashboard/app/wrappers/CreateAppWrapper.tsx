import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reactClient as vincentApiClient, docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';
import { useWagmiSigner } from '@/hooks/developer-dashboard/useWagmiSigner';
import { useEnsureChain } from '@/hooks/developer-dashboard/useEnsureChain';
import { Ability } from '@/types/developer-dashboard/appTypes';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import Loading from '@/components/shared/ui/Loading';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Trash2 } from 'lucide-react';
import { theme, fonts } from '@/lib/themeClasses';
import { registryUrl } from '@/config/registry';
import { Form } from '@/components/shared/ui/form';
import {
  TextField,
  LongTextField,
  ImageUploadField,
  DeploymentStatusSelectField,
} from '@/components/developer-dashboard/form-fields';
import { AbilitySelectorModal } from '@/components/developer-dashboard/ui/AbilitySelectorModal';

type CreateAppStep = 'abilities' | 'delegatees' | 'metadata' | 'review' | 'submitting';

interface SelectedAbility {
  ability: Ability;
  ipfsCid: string;
  policies: string[]; // Policy IPFS CIDs
}

// Schema for app metadata
const { appDoc } = docSchemas;
const { name, description, contactEmail, appUrl, logo, deploymentStatus } = appDoc.shape;

const AppMetadataSchema = z
  .object({
    name,
    description,
    contactEmail,
    appUrl,
    logo,
    deploymentStatus,
  })
  .strict();

type AppMetadataFormData = z.infer<typeof AppMetadataSchema>;

const CREATE_APP_STORAGE_KEY = 'vincentCreateAppDraft';

interface SavedFormState {
  currentStep: CreateAppStep;
  selectedAbilities: Array<[string, SelectedAbility]>;
  delegateeAddresses: string[];
  metadataFormValues: Partial<AppMetadataFormData>;
  savedAt: number;
}

export function CreateAppWrapper() {
  const navigate = useNavigate();
  const { getSigner } = useWagmiSigner();
  const { ensureChain, infoMessage } = useEnsureChain();
  const [currentStep, setCurrentStep] = useState<CreateAppStep>('abilities');
  const [selectedAbilities, setSelectedAbilities] = useState<Map<string, SelectedAbility>>(
    new Map(),
  );
  const [delegateeAddresses, setDelegateeAddresses] = useState<string[]>([]);
  const [delegateeInput, setDelegateeInput] = useState('');
  const [delegateeError, setDelegateeError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<
    'signing' | 'confirming' | 'creating-registry' | null
  >(null);
  const [isAbilitySelectorOpen, setIsAbilitySelectorOpen] = useState(false);
  const [isRestoringState, setIsRestoringState] = useState(true);

  // Registry metadata form
  const [metadataFormData, setMetadataFormData] = useState<AppMetadataFormData | null>(null);

  const metadataForm = useForm<AppMetadataFormData>({
    resolver: zodResolver(AppMetadataSchema),
    defaultValues: {
      deploymentStatus: 'dev',
    },
  });

  // Clear saved form state (call on successful submission)
  const clearSavedFormState = () => {
    localStorage.removeItem(CREATE_APP_STORAGE_KEY);
  };

  // Load saved state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CREATE_APP_STORAGE_KEY);
      if (saved) {
        const state: SavedFormState = JSON.parse(saved);
        // Only restore if saved within last 24 hours
        if (Date.now() - state.savedAt < 24 * 60 * 60 * 1000) {
          // Don't restore if we were in the middle of submitting
          if (state.currentStep !== 'submitting') {
            setCurrentStep(state.currentStep);
          }
          setSelectedAbilities(new Map(state.selectedAbilities));
          setDelegateeAddresses(state.delegateeAddresses);
          // Restore form values
          if (state.metadataFormValues) {
            Object.entries(state.metadataFormValues).forEach(([key, value]) => {
              if (value !== undefined) {
                metadataForm.setValue(key as keyof AppMetadataFormData, value as any);
              }
            });
            // If we're past the metadata step, also set metadataFormData
            if (state.currentStep === 'review' || state.currentStep === 'submitting') {
              setMetadataFormData(state.metadataFormValues as AppMetadataFormData);
            }
          }
        } else {
          // Clear expired saved state
          localStorage.removeItem(CREATE_APP_STORAGE_KEY);
        }
      }
    } catch (e) {
      // Invalid saved state, clear it
      localStorage.removeItem(CREATE_APP_STORAGE_KEY);
    }
    setIsRestoringState(false);
  }, []);

  // Watch form values for persistence
  const watchedFormValues = metadataForm.watch();

  // Save state on changes (debounced)
  useEffect(() => {
    if (isRestoringState) return;

    const timeoutId = setTimeout(() => {
      const state: SavedFormState = {
        currentStep,
        selectedAbilities: Array.from(selectedAbilities.entries()),
        delegateeAddresses,
        metadataFormValues: watchedFormValues,
        savedAt: Date.now(),
      };
      localStorage.setItem(CREATE_APP_STORAGE_KEY, JSON.stringify(state));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentStep, selectedAbilities, delegateeAddresses, watchedFormValues, isRestoringState]);

  const {
    register: metadataRegister,
    handleSubmit: handleMetadataSubmit,
    watch: metadataWatch,
    setValue: metadataSetValue,
    control: metadataControl,
    setError: metadataSetError,
    clearErrors: metadataClearErrors,
    formState: { errors: metadataErrors },
  } = metadataForm;

  // Fetch available abilities
  const { data: abilities, isLoading: abilitiesLoading } =
    vincentApiClient.useListAllAbilitiesQuery();

  // Mutations for registry
  const [createApp] = vincentApiClient.useCreateAppMutation();
  const [createAppVersionAbility] = vincentApiClient.useCreateAppVersionAbilityMutation();

  const handleAbilityAdd = async (ability: Ability) => {
    try {
      // Get the active version's IPFS CID
      const activeVersion = ability.activeVersion;
      if (!activeVersion) {
        console.error('Ability has no active version:', ability);
        setError('Selected ability has no active version');
        return;
      }

      // Use fetch directly since we can't use hooks conditionally
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

      // Use functional state update to avoid race conditions when multiple abilities are added
      setSelectedAbilities((prevSelected) => {
        const newSelected = new Map(prevSelected);
        newSelected.set(ability.packageName, {
          ability,
          ipfsCid: abilityVersion.ipfsCid,
          policies: [], // TODO: Add policy selection
        });
        return newSelected;
      });
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Failed to add ability:', err);
      setError(err instanceof Error ? err.message : 'Failed to add ability');
    }
  };

  const handleAbilityRemove = (packageName: string) => {
    const newSelected = new Map(selectedAbilities);
    newSelected.delete(packageName);
    setSelectedAbilities(newSelected);
    setError(null); // Clear any errors when removing abilities
  };

  const handleDelegateeInputChange = (value: string) => {
    setDelegateeInput(value);
    setDelegateeError(null);

    const address = value.trim();

    // Check if it's a valid Ethereum address
    if (ethers.utils.isAddress(address)) {
      // Check if already added
      if (delegateeAddresses.includes(address)) {
        setDelegateeError('Address already added');
        return;
      }

      // Automatically add the valid address
      setDelegateeAddresses([...delegateeAddresses, address]);
      setDelegateeInput('');
      setDelegateeError(null);
    }
  };

  const handleRemoveDelegatee = (address: string) => {
    setDelegateeAddresses(delegateeAddresses.filter((a) => a !== address));
    setDelegateeError(null);
  };

  const handleNextFromAbilities = () => {
    if (selectedAbilities.size === 0) {
      setError('Please select at least one ability before continuing');
      return;
    }
    setError(null);
    setCurrentStep('delegatees');
  };

  const handleNextFromDelegatees = () => {
    setError(null);
    setCurrentStep('metadata');
  };

  const handleNextFromMetadata = (data: AppMetadataFormData) => {
    // Store form data for later use
    setMetadataFormData(data);
    setError(null);
    setCurrentStep('review');
  };

  const handleBack = () => {
    setError(null);
    if (currentStep === 'delegatees') {
      setCurrentStep('abilities');
    } else if (currentStep === 'metadata') {
      setCurrentStep('delegatees');
    } else if (currentStep === 'review') {
      setCurrentStep('metadata');
    }
  };

  const handleFinalSubmit = async () => {
    if (!metadataFormData) {
      setError('Missing app metadata');
      return;
    }

    // Step 1: Ensure user is on Base Sepolia (before starting submission)
    try {
      const canProceed = await ensureChain('Register App On-Chain');
      if (!canProceed) return; // Chain was switched, user needs to click again
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to switch network');
      return;
    }

    setCurrentStep('submitting');
    setSubmissionStatus('signing');
    setError(null);

    try {
      // Step 2: Register app on-chain with abilities
      const signer = await getSigner();
      const client = getClient({ signer });

      const abilityIpfsCids = Array.from(selectedAbilities.values()).map((sa) => sa.ipfsCid);
      const abilityPolicies = Array.from(selectedAbilities.values()).map((sa) => sa.policies);

      const result = await client.registerApp({
        delegateeAddresses,
        versionAbilities: {
          abilityIpfsCids,
          abilityPolicies,
        },
      });

      const appId = result.appId;

      // Step 3: Wait a bit for indexing
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Step 5: Create app in registry
      setSubmissionStatus('creating-registry');
      // console.log('[CreateApp] Creating app in registry...');
      try {
        await createApp({
          appCreate: {
            appId,
            name: metadataFormData.name,
            description: metadataFormData.description,
            contactEmail: metadataFormData.contactEmail,
            appUrl: metadataFormData.appUrl,
            logo: metadataFormData.logo,
            deploymentStatus: metadataFormData.deploymentStatus,
          },
        }).unwrap();
        // console.log('[CreateApp] App created in registry');
      } catch (registryError: any) {
        // console.error('[CreateApp] Failed to create app in registry:', registryError);
        // App exists on-chain, so we can still navigate to it
        // The user can add metadata later
        clearSavedFormState();
        navigate(`/developer/apps/appId/${appId}?action=create-in-registry`);
        return;
      }

      // Step 6: Create all AppVersionAbility records in registry
      // console.log('[CreateApp] Creating AppVersionAbility records...');
      try {
        const abilityCreationPromises = Array.from(selectedAbilities.values()).map(
          ({ ability }) => {
            console.log(
              '[CreateApp] Creating ability:',
              ability.packageName,
              'v',
              ability.activeVersion,
            );
            return createAppVersionAbility({
              appId,
              appVersion: 1,
              abilityPackageName: ability.packageName,
              appVersionAbilityCreate: {
                abilityVersion: ability.activeVersion,
                hiddenSupportedPolicies: [],
              },
            }).unwrap();
          },
        );

        await Promise.all(abilityCreationPromises);
        // console.log('[CreateApp] All AppVersionAbility records created');
      } catch (abilityError: any) {
        // Navigate to version abilities page where user can add them manually
        clearSavedFormState();
        navigate(`/developer/apps/appId/${appId}/version/1/abilities`);
        return;
      }

      // Step 7: Navigate to the app detail page
      clearSavedFormState();
      navigate(`/developer/apps/appId/${appId}`);
    } catch (err: any) {
      console.error('Failed to create app on-chain:', err);

      // Extract user-friendly error message
      let errorMessage = 'Failed to create app on-chain';
      if (err.code === 'ACTION_REJECTED' || err.message?.includes('user rejected')) {
        errorMessage =
          'Transaction was rejected. Please try again and approve the transaction in your wallet.';
      } else if (err.code === 'INSUFFICIENT_FUNDS') {
        errorMessage =
          'Insufficient funds to complete the transaction. Please add more ETH to your wallet.';
      } else if (err.message) {
        // Extract just the first part of the error message (before transaction details)
        const match = err.message.match(/^([^(]+)/);
        errorMessage = match ? match[1].trim() : err.message.substring(0, 100);
      }

      setError(errorMessage);
      setCurrentStep('review');
      setSubmissionStatus(null);
    }
  };

  if (currentStep === 'submitting') {
    return (
      <>
        <Breadcrumb
          items={[
            { label: 'Apps', onClick: () => navigate('/developer/apps') },
            { label: 'Create App' },
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
                Check your wallet to approve the app registration transaction
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
                Adding app, version, and abilities to the Vincent Registry
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

  // Safety check - render nothing if we have a critical error
  if (!abilities && !abilitiesLoading) {
    return (
      <>
        <Breadcrumb
          items={[
            { label: 'Apps', onClick: () => navigate('/developer/apps') },
            { label: 'Create App' },
          ]}
        />
        <StatusMessage message="Failed to load abilities. Please try again." type="error" />
      </>
    );
  }

  // Progress bar data
  const steps = [
    { name: 'Select Abilities', step: 'abilities' },
    { name: 'Add Delegatees', step: 'delegatees' },
    { name: 'App Details', step: 'metadata' },
    { name: 'Review', step: 'review' },
    { name: 'Register', step: 'submitting' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.step === currentStep);

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Apps', onClick: () => navigate('/developer/apps') },
          { label: 'Create App' },
        ]}
      />

      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${theme.text}`}>Create New App</h1>
        <p className={`${theme.textMuted} mt-2`}>
          Follow the steps below to register your app on-chain with abilities and delegatees.
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

      {abilitiesLoading ? (
        <Loading />
      ) : !abilities || abilities.length === 0 ? (
        <StatusMessage message="No abilities available. Please contact support." type="warning" />
      ) : (
        <>
          {/* Step 1: Select Abilities */}
          {currentStep === 'abilities' && (
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
                  onClick={handleNextFromAbilities}
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
                  Next: Add Delegatees
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Add Delegatees */}
          {currentStep === 'delegatees' && (
            <>
              <div className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl p-6`}>
                <h3 className={`text-lg font-semibold mb-2 ${theme.text}`} style={fonts.heading}>
                  Delegatee Addresses
                  <span className={`text-xs ml-2 ${theme.textMuted} font-normal`}>(Optional)</span>
                </h3>
                <p className={`${theme.textMuted} text-sm mb-2`} style={fonts.body}>
                  Add Ethereum addresses that can manage this app on your behalf.
                </p>
                <div className={`p-3 rounded-lg ${theme.warningBg} mb-4`}>
                  <p className={`${theme.warningText} text-xs`} style={fonts.body}>
                    <strong>Note:</strong> Adding delegatees later will require a separate
                    blockchain transaction and gas fees. Consider adding them now to save on gas
                    costs.
                  </p>
                </div>

                {/* Add Delegatee Input */}
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Paste Ethereum address (0x...) - automatically adds when valid"
                    value={delegateeInput}
                    onChange={(e) => handleDelegateeInputChange(e.target.value)}
                    className={delegateeError ? 'border-red-500 dark:border-red-400' : ''}
                  />
                </div>

                {delegateeError && (
                  <p className="text-sm text-red-500 dark:text-red-400 mb-4">{delegateeError}</p>
                )}

                {/* List of Added Delegatees */}
                {delegateeAddresses.length > 0 && (
                  <div className="space-y-2">
                    {delegateeAddresses.map((address, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}
                      >
                        <span className={`text-sm font-mono ${theme.text}`} style={fonts.body}>
                          {address}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDelegatee(address)}
                          className="hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <Button onClick={handleBack} variant="outline">
                  Back
                </Button>
                <Button
                  onClick={handleNextFromDelegatees}
                  className="text-white px-8"
                  style={{ backgroundColor: theme.brandOrange }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.brandOrange;
                  }}
                >
                  Next: App Details
                </Button>
              </div>
            </>
          )}

          {/* Step 3: App Metadata */}
          {currentStep === 'metadata' && (
            <>
              <div className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl p-6`}>
                <p className={`${theme.textMuted} text-sm mb-6`} style={fonts.body}>
                  Provide metadata for your app and version 1. This information will be stored in
                  the Vincent Registry.
                </p>

                <Form {...metadataForm}>
                  <form
                    onSubmit={handleMetadataSubmit(handleNextFromMetadata)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 items-start">
                      {/* Left Column - Basic Information */}
                      <div>
                        <h3
                          className={`text-sm font-semibold mb-4 ${theme.text}`}
                          style={fonts.heading}
                        >
                          Basic Information
                        </h3>
                        <div className="space-y-6">
                          <TextField
                            name="name"
                            register={metadataRegister}
                            error={metadataErrors.name?.message}
                            label="App Name"
                            placeholder="Enter app name"
                            required
                          />

                          <TextField
                            name="contactEmail"
                            register={metadataRegister}
                            error={metadataErrors.contactEmail?.message}
                            label="Contact Email"
                            placeholder="contact@example.com"
                            required
                          />

                          <LongTextField
                            name="description"
                            register={metadataRegister}
                            error={metadataErrors.description?.message}
                            label="Description"
                            placeholder="Describe your application"
                            rows={4}
                            required
                          />

                          <TextField
                            name="appUrl"
                            register={metadataRegister}
                            error={metadataErrors.appUrl?.message}
                            label="App URL"
                            placeholder="https://yourapp.com"
                            required
                          />
                        </div>
                      </div>

                      {/* Right Column - Configuration */}
                      <div>
                        <h3
                          className={`text-sm font-semibold mb-4 ${theme.text}`}
                          style={fonts.heading}
                        >
                          Configuration
                        </h3>
                        <div className="space-y-6">
                          <ImageUploadField
                            name="logo"
                            watch={metadataWatch}
                            setValue={metadataSetValue}
                            control={metadataControl}
                            setError={metadataSetError}
                            clearErrors={metadataClearErrors}
                            label="Logo"
                          />

                          <DeploymentStatusSelectField
                            error={metadataErrors.deploymentStatus?.message}
                            control={metadataControl}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-between">
                      <Button type="button" onClick={handleBack} variant="outline">
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="text-white px-8"
                        style={{ backgroundColor: theme.brandOrange, ...fonts.heading }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = theme.brandOrange;
                        }}
                      >
                        Next: Review
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </>
          )}

          {/* Step 4: Review */}
          {currentStep === 'review' && (
            <>
              <div
                className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl p-6 mb-6`}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme.text}`} style={fonts.heading}>
                  Review Your App
                </h3>

                {/* App Details */}
                {metadataFormData && (
                  <div className="mb-6">
                    <h4
                      className={`text-sm font-semibold mb-2 ${theme.text}`}
                      style={fonts.heading}
                    >
                      App Details
                    </h4>
                    <div
                      className={`p-3 rounded-lg ${theme.itemBg} border ${theme.cardBorder} space-y-2`}
                    >
                      <div>
                        <span className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                          Name:
                        </span>
                        <div className={`font-semibold ${theme.text}`} style={fonts.body}>
                          {metadataFormData.name}
                        </div>
                      </div>
                      <div>
                        <span className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                          Description:
                        </span>
                        <div className={`${theme.text}`} style={fonts.body}>
                          {metadataFormData.description}
                        </div>
                      </div>
                      <div>
                        <span className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                          Contact Email:
                        </span>
                        <div className={`${theme.text}`} style={fonts.body}>
                          {metadataFormData.contactEmail}
                        </div>
                      </div>
                      <div>
                        <span className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                          App URL:
                        </span>
                        <div className={`${theme.text}`} style={fonts.body}>
                          {metadataFormData.appUrl}
                        </div>
                      </div>
                      {metadataFormData.logo && (
                        <div>
                          <span className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                            Logo:
                          </span>
                          <div className={`${theme.text}`} style={fonts.body}>
                            {metadataFormData.logo}
                          </div>
                        </div>
                      )}
                      <div>
                        <span className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                          Deployment Status:
                        </span>
                        <div className={`${theme.text} capitalize`} style={fonts.body}>
                          {metadataFormData.deploymentStatus}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Abilities */}
                <div className="mb-6">
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

                {/* Delegatee Addresses */}
                <div>
                  <h4 className={`text-sm font-semibold mb-2 ${theme.text}`} style={fonts.heading}>
                    Delegatee Addresses ({delegateeAddresses.length})
                  </h4>
                  {delegateeAddresses.length > 0 ? (
                    <div className="space-y-2">
                      {delegateeAddresses.map((address, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}
                        >
                          <span className={`text-sm font-mono ${theme.text}`} style={fonts.body}>
                            {address}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`p-3 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}>
                      <span className={`text-sm ${theme.textMuted}`} style={fonts.body}>
                        No delegatees added. You can add them later from the app management page.
                      </span>
                    </div>
                  )}
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
                  Register App On-Chain
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
      )}
    </>
  );
}
