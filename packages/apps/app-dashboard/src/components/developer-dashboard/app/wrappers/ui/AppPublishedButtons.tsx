import { useState, useEffect } from 'react';
import { Plus, Users, Trash2, RotateCcw, Edit } from 'lucide-react';
import { ethers } from 'ethers';
import { App, deleteApp, undeleteApp } from '@lit-protocol/vincent-contracts-sdk';
import MutationButtonStates, { SkeletonButton } from '@/components/layout/MutationButtonStates';

interface AppPublishedButtonsProps {
  appId: number;
  onOpenMutation: (mutationType: string) => void;
  blockchainAppData: App;
  refetchBlockchainData: () => void;
}

export function AppPublishedButtons({
  appId,
  onOpenMutation,
  blockchainAppData,
  refetchBlockchainData,
}: AppPublishedButtonsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleToggleDeleteApp = async () => {
    const isDeleted = blockchainAppData.isDeleted;
    setError(null); // Clear any previous errors
    setIsProcessing(true);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();

      if (isDeleted) {
        // Undelete the app using contract call
        await undeleteApp({
          signer: signer,
          args: {
            appId: appId.toString(),
          },
        });
      } else {
        // Delete the app using contract call
        await deleteApp({
          signer: signer,
          args: {
            appId: appId.toString(),
          },
        });
      }

      setSuccess(isDeleted ? 'App undeleted successfully!' : 'App deleted successfully!');

      // Refetch on-chain data after showing success message
      setTimeout(() => {
        refetchBlockchainData();
      }, 3000);
    } catch (error: any) {
      // Handle user rejection gracefully
      if (error?.message?.includes('user rejected')) {
        setError('Transaction rejected.');
      } else {
        setError(error.message || 'Failed to delete/undelete app. Please try again.');
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
      <MutationButtonStates type="error" errorMessage={error || 'Failed to delete/undelete app'} />
    );
  }

  if (success) {
    return (
      <MutationButtonStates
        type="success"
        successMessage={success || 'App updated successfully!'}
      />
    );
  }

  const isDeleted = blockchainAppData.isDeleted;

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => onOpenMutation('edit-published-app')}
        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
      >
        <Edit className="h-4 w-4" />
        Edit App
      </button>
      <button
        onClick={() => onOpenMutation('create-app-version')}
        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Create App Version
      </button>
      <button
        onClick={() => onOpenMutation('manage-delegatees')}
        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
      >
        <Users className="h-4 w-4" />
        Manage Delegatees
      </button>
      <button
        onClick={handleToggleDeleteApp}
        disabled={isProcessing}
        className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          isDeleted
            ? 'border-green-200 text-green-600 hover:bg-green-50'
            : 'border-red-200 text-red-600 hover:bg-red-50'
        }`}
      >
        {isProcessing ? (
          <SkeletonButton />
        ) : isDeleted ? (
          <>
            <RotateCcw className="h-4 w-4" />
            Undelete App
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4" />
            Delete App
          </>
        )}
      </button>
    </div>
  );
}
