import { useState, useEffect } from 'react';
import { Plus, Users, Trash2, RotateCcw } from 'lucide-react';
import { ethers } from 'ethers';
import { App, deleteApp, undeleteApp } from '@lit-protocol/vincent-contracts-sdk';
import LoadingSkeleton from '@/components/layout/LoadingSkeleton';

interface AppPublishedButtonsProps {
  appId: number;
  onOpenMutation: (mutationType: string) => void;
  blockchainAppData: App;
}

export function AppPublishedButtons({
  appId,
  onOpenMutation,
  blockchainAppData,
}: AppPublishedButtonsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Refresh the page to get updated data
      // TODO: Find a better way to do this. Our registry queries get automatic cache invalidation, so they don't need to worry about
      // notifying the data layer with a callback or anything, but we need to since the contracts don't have caching and **need** to be the latest data.
      window.location.reload();
    } catch (error: any) {
      setError(error.message || 'Failed to delete/undelete app');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [error]);

  if (error) {
    return <LoadingSkeleton type="error" errorMessage={error || 'Failed to delete/undelete app'} />;
  }

  const isDeleted = blockchainAppData.isDeleted;

  return (
    <div className="flex flex-wrap gap-3">
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
          <div
            className={`animate-spin rounded-full h-4 w-4 border-b-2 ${isDeleted ? 'border-green-600' : 'border-red-600'}`}
          ></div>
        ) : isDeleted ? (
          <RotateCcw className="h-4 w-4" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        {isProcessing
          ? isDeleted
            ? 'Undeleting...'
            : 'Deleting...'
          : isDeleted
            ? 'Undelete App'
            : 'Delete App'}
      </button>
    </div>
  );
}
