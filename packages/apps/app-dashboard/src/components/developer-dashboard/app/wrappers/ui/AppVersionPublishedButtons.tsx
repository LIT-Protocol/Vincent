import { useEffect, useState } from 'react';
import { Power, PowerOff } from 'lucide-react';
import { ethers } from 'ethers';
import { AppVersion, enableAppVersion } from '@lit-protocol/vincent-contracts-sdk';
import LoadingSkeleton from '@/components/layout/LoadingSkeleton';

interface AppVersionPublishedButtonsProps {
  appId: number;
  versionId: number;
  appVersionData: AppVersion;
}

export function AppVersionPublishedButtons({
  appId,
  versionId,
  appVersionData,
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

      // TODO: Find a better way to do this. Our registry queries get automatic cache invalidation, so they don't need to worry about
      // notifying the data layer with a callback or anything, but we need to since the contracts don't have caching and **need** to be the latest data.
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to toggle app version. Please try again.');
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
    return <LoadingSkeleton type="error" errorMessage={error || 'Failed to toggle app version'} />;
  }

  if (success) {
    return (
      <LoadingSkeleton
        type="success"
        successMessage={success || 'App version toggled successfully!'}
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
          <LoadingSkeleton type="button" />
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
