import { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { ethers } from 'ethers';
import { undeleteApp } from '@lit-protocol/vincent-contracts-sdk';
import MutationButtonStates, { SkeletonButton } from '@/components/layout/MutationButtonStates';

interface AppPublishedDeletedButtonsProps {
  appId: number;
  onOpenMutation: (mutationType: string) => void;
  refetchBlockchainData: () => void;
}

export function AppPublishedDeletedButtons({
  appId,
  refetchBlockchainData,
}: AppPublishedDeletedButtonsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleToggleUndeleteApp = async () => {
    setError(null); // Clear any previous errors
    setIsProcessing(true);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();

      // Undelete the app using contract call
      await undeleteApp({
        signer: signer,
        args: {
          appId: appId.toString(),
        },
      });

      setSuccess('App undeleted successfully!');

      // Refetch on-chain data after showing success message
      setTimeout(() => {
        refetchBlockchainData();
      }, 3000);
    } catch (error: any) {
      // Handle user rejection gracefully
      if (error?.message?.includes('user rejected')) {
        setError('Transaction rejected.');
      } else {
        setError(error.message || 'Failed to undelete app. Please try again.');
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
    return <MutationButtonStates type="error" errorMessage={error || 'Failed to undelete app'} />;
  }

  if (success) {
    return (
      <MutationButtonStates
        type="success"
        successMessage={success || 'App updated successfully!'}
      />
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={handleToggleUndeleteApp}
        disabled={isProcessing}
        className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${'border-green-200 text-green-600 hover:bg-green-50'}`}
      >
        {isProcessing ? (
          <SkeletonButton />
        ) : (
          <>
            <RotateCcw className="h-4 w-4" />
            Undelete App
          </>
        )}
      </button>
    </div>
  );
}
