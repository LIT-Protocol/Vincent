import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

/**
 * Hook to detect if the app is running inside Farcaster
 * @returns boolean indicating if running in Farcaster miniapp context
 */
export function useFarcaster() {
  const [isInFarcaster, setIsInFarcaster] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFarcasterContext = async () => {
      try {
        const isMiniApp = await sdk.isInMiniApp();
        setIsInFarcaster(isMiniApp);
      } catch (error) {
        // Not in Farcaster context
        setIsInFarcaster(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFarcasterContext();
  }, []);

  return { isInFarcaster, isLoading };
}
