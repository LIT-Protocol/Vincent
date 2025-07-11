import { useEffect, useState } from 'react';
import { Power, PowerOff } from 'lucide-react';
import { ethers } from 'ethers';
import { AppVersion, enableAppVersion } from '@lit-protocol/vincent-contracts-sdk';
import MutationButtonStates, { SkeletonButton } from '@/components/layout/MutationButtonStates';

interface AppVersionPublishedButtonsProps {
  appId: number;
  versionId: number;
  appVersionData: AppVersion;
  refetchBlockchainAppVersionData: () => void;
}

export function AppVersionPublishedButtons({
  appId,
  versionId,
  appVersionData,
  refetchBlockchainAppVersionData,
}: AppVersionPublishedButtonsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleToggleAppVersion = async () => {
    const newEnabledState = !appVersionData.enabled;
    setError(null); // Clear any previous errors
    setIsProcessing(true);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();

      await enableAppVersion({
        signer: signer,
        args: {
          appId: appId.toString(),
          appVersion: versionId.toString(),
          enabled: newEnabledState,
        },
      });

      setSuccess('App version toggled successfully!');

      // Refetch on-chain data after showing success message
      setTimeout(() => {
        refetchBlockchainAppVersionData();
      }, 3000);
    } catch (error: any) {
      // Handle user rejection gracefully
      if (error?.message?.includes('user rejected')) {
        setError('Transaction rejected.');
      } else {
        setError(error.message || 'Failed to toggle app version. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [error]);

  if (error) {
    return (
      <MutationButtonStates type="error" errorMessage={error || 'Failed to toggle app version'} />
    );
  }

  if (success) {
    return (
      <MutationButtonStates
        type="success"
        successMessage={success || 'Version updated successfully!'}
      />
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={handleToggleAppVersion}
        className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium bg-white transition-colors ${
          appVersionData.enabled
            ? 'border-red-300 text-red-700 hover:bg-red-50'
            : 'border-green-300 text-green-700 hover:bg-green-50'
        }`}
      >
        {isProcessing ? (
          <SkeletonButton />
        ) : appVersionData.enabled ? (
          <>
            <PowerOff className="h-4 w-4" />
            Disable App Version
          </>
        ) : (
          <>
            <Power className="h-4 w-4" />
            Enable App Version
          </>
        )}
      </button>
    </div>
  );
}
