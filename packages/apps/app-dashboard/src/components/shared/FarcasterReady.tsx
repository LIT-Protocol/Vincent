import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

/**
 * Component that calls sdk.actions.ready() to hide the Farcaster splash screen
 * Should be mounted after all providers are initialized and content is ready
 */
export function FarcasterReady() {
  useEffect(() => {
    try {
      sdk.actions.ready();
      console.log('Farcaster SDK ready() called successfully');
    } catch (error) {
      // Not running in Farcaster context, this is expected
      console.log('Not running in Farcaster context:', error);
    }
  }, []);

  return null;
}
