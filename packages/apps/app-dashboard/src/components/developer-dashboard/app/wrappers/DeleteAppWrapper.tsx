import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { DeleteAppForm } from '../forms/DeleteAppForm';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/shared/ui/Loading';
import { initPkpSigner } from '@/utils/developer-dashboard/initPkpSigner';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { useBlockchainAppData } from '@/hooks/useBlockchainAppData';

export function DeleteAppWrapper() {
  const { appId } = useParams<{ appId: string }>();
  const { authInfo, sessionSigs } = useReadAuthInfo();
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetching app data
  const {
    data: app,
    isLoading: appLoading,
    isError: appError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) });

  // Fetching blockchain data to determine if app is published
  const { blockchainAppData, blockchainAppLoading } = useBlockchainAppData(Number(appId));
  const isPublished = blockchainAppData !== null;

  // Mutation
  const [deleteApp, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useDeleteAppMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data) {
      navigate('/developer/apps'); // Navigate immediately, no delay needed
    }
  }, [isSuccess, data, navigate]);

  // Loading states
  if (appLoading || blockchainAppLoading) return <Loading />;

  // Error states
  if (appError) return <StatusMessage message="Failed to load app" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Deleting app..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="App deleted successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to delete app');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      // Step 1: Always delete in registry
      await deleteApp({ appId: app.appId });

      // Step 2: If published, also delete on-chain
      if (isPublished) {
        const pkpSigner = await initPkpSigner({ authInfo, sessionSigs });
        const client = getClient({ signer: pkpSigner });
        await client.deleteApp({
          appId: Number(app.appId),
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <div className="space-y-6">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Delete App</h1>
            <p className="text-gray-600 dark:text-white/60 mt-2">Delete "{app.name}"?</p>
          </div>
        </div>
      </div>

      <DeleteAppForm
        appName={app.name}
        onSubmit={handleSubmit}
        isSubmitting={isLoading || isProcessing}
      />
    </div>
  );
}
