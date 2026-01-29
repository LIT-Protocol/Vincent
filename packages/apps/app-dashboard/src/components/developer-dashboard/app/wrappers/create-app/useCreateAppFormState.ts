import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reactClient as vincentApiClient, docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { useWagmiSigner } from '@/hooks/developer-dashboard/useWagmiSigner';
import { useEnsureChain } from '@/hooks/developer-dashboard/useEnsureChain';
import { Ability } from '@/types/developer-dashboard/appTypes';
import { registryUrl } from '@/config/registry';
import { CreateAppStep, SelectedAbility, CREATE_APP_STORAGE_KEY } from './types';

// Form validation schema using existing Zod schemas from registry
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

export type AppMetadataFormData = z.infer<typeof AppMetadataSchema>;

interface SavedFormState {
  currentStep: CreateAppStep;
  selectedAbilities: Array<[string, SelectedAbility]>;
  delegateeAddresses: string[];
  metadataFormValues: Partial<AppMetadataFormData>;
  savedAt: number;
}

export function useCreateAppFormState() {
  const navigate = useNavigate();
  const { getSigner } = useWagmiSigner();
  const { ensureChain, infoMessage } = useEnsureChain();

  // Step state
  const [currentStep, setCurrentStep] = useState<CreateAppStep>('abilities');
  const [isRestoringState, setIsRestoringState] = useState(true);

  // Abilities state
  const [selectedAbilities, setSelectedAbilities] = useState<Map<string, SelectedAbility>>(
    new Map(),
  );
  const [isAbilitySelectorOpen, setIsAbilitySelectorOpen] = useState(false);

  // Delegatees state
  const [delegateeAddresses, setDelegateeAddresses] = useState<string[]>([]);
  const [delegateeInput, setDelegateeInput] = useState('');
  const [delegateeError, setDelegateeError] = useState<string | null>(null);

  // Metadata state
  const [metadataFormData, setMetadataFormData] = useState<AppMetadataFormData | null>(null);

  // Submission state
  const [error, setError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<
    'signing' | 'confirming' | 'creating-registry' | null
  >(null);

  // Form setup
  const metadataForm = useForm<AppMetadataFormData>({
    resolver: zodResolver(AppMetadataSchema),
    defaultValues: {
      deploymentStatus: 'dev',
    },
  });

  // API hooks
  const { data: abilities, isLoading: abilitiesLoading } =
    vincentApiClient.useListAllAbilitiesQuery();
  const [createApp] = vincentApiClient.useCreateAppMutation();
  const [createAppVersionAbility] = vincentApiClient.useCreateAppVersionAbilityMutation();

  // Watch form values for persistence
  const watchedFormValues = metadataForm.watch();

  // Clear saved form state
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

  // Ability handlers
  const handleAbilityAdd = async (ability: Ability) => {
    try {
      const activeVersion = ability.activeVersion;
      if (!activeVersion) {
        console.error('Ability has no active version:', ability);
        setError('Selected ability has no active version');
        return;
      }

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

      setSelectedAbilities((prevSelected) => {
        const newSelected = new Map(prevSelected);
        newSelected.set(ability.packageName, {
          ability,
          ipfsCid: abilityVersion.ipfsCid,
          policies: [],
        });
        return newSelected;
      });
      setError(null);
    } catch (err) {
      console.error('Failed to add ability:', err);
      setError(err instanceof Error ? err.message : 'Failed to add ability');
    }
  };

  const handleAbilityRemove = (packageName: string) => {
    const newSelected = new Map(selectedAbilities);
    newSelected.delete(packageName);
    setSelectedAbilities(newSelected);
    setError(null);
  };

  // Delegatee handlers
  const handleDelegateeInputChange = (value: string) => {
    setDelegateeInput(value);
    setDelegateeError(null);

    const address = value.trim();

    if (ethers.utils.isAddress(address)) {
      if (delegateeAddresses.includes(address)) {
        setDelegateeError('Address already added');
        return;
      }

      setDelegateeAddresses([...delegateeAddresses, address]);
      setDelegateeInput('');
      setDelegateeError(null);
    }
  };

  const handleRemoveDelegatee = (address: string) => {
    setDelegateeAddresses(delegateeAddresses.filter((a) => a !== address));
    setDelegateeError(null);
  };

  // Navigation handlers
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

  // Final submission
  const handleFinalSubmit = async () => {
    if (!metadataFormData) {
      setError('Missing app metadata');
      return;
    }

    // Step 1: Ensure user is on Base Sepolia
    try {
      const canProceed = await ensureChain('Register App On-Chain');
      if (!canProceed) return;
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

      // Step 4: Create app in registry
      setSubmissionStatus('creating-registry');
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
      } catch (registryError: any) {
        clearSavedFormState();
        navigate(`/developer/apps/appId/${appId}?action=create-in-registry`);
        return;
      }

      // Step 5: Create all AppVersionAbility records in registry
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
      } catch (abilityError: any) {
        clearSavedFormState();
        navigate(`/developer/apps/appId/${appId}/version/1/abilities`);
        return;
      }

      // Step 6: Navigate to the app detail page
      clearSavedFormState();
      navigate(`/developer/apps/appId/${appId}`);
    } catch (err: any) {
      console.error('Failed to create app on-chain:', err);

      let errorMessage = 'Failed to create app on-chain';
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

  return {
    // Step state
    currentStep,
    isRestoringState,

    // Abilities
    selectedAbilities,
    isAbilitySelectorOpen,
    setIsAbilitySelectorOpen,
    handleAbilityAdd,
    handleAbilityRemove,
    abilities,
    abilitiesLoading,

    // Delegatees
    delegateeAddresses,
    delegateeInput,
    delegateeError,
    handleDelegateeInputChange,
    handleRemoveDelegatee,

    // Metadata
    metadataForm,
    metadataFormData,

    // Submission
    error,
    submissionStatus,
    infoMessage,

    // Navigation
    handleNextFromAbilities,
    handleNextFromDelegatees,
    handleNextFromMetadata,
    handleBack,
    handleFinalSubmit,
  };
}
