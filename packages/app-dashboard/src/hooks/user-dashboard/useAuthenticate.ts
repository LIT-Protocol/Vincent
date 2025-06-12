import { useCallback, useState } from 'react';
import { AuthMethod } from '@lit-protocol/types';
import {
  authenticateWithWebAuthn,
  authenticateWithStytch,
  authenticateWithEthWallet,
} from '@/utils/user-dashboard/lit';

export default function useAuthenticate() {
  const [authMethod, setAuthMethod] = useState<AuthMethod>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error>();

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(undefined);
  }, []);

  /**
   * Authenticate with WebAuthn credential
   */
  const authWithWebAuthn = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(undefined);
    setAuthMethod(undefined);

    try {
      const result: AuthMethod = await authenticateWithWebAuthn();
      setAuthMethod(result);
    } catch (err) {
      // Check if this is a user cancellation - if so, don't treat it as an error
      if (err instanceof Error) {
        const errorText = err.message;
        if (
          errorText.includes('timed out') ||
          errorText.includes('not allowed') ||
          errorText.includes('cancelled') ||
          errorText.includes('privacy-considerations-client')
        ) {
          // User cancelled - silently ignore, don't set error state
        } else {
          setError(err as Error);
        }
      } else {
        setError(err as Error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Authenticate with Stytch
   */
  const authWithStytch = useCallback(
    async (accessToken: string, userId?: string, method?: string): Promise<void> => {
      setLoading(true);
      setError(undefined);
      setAuthMethod(undefined);

      try {
        const result: AuthMethod = await authenticateWithStytch(
          accessToken,
          userId,
          method as 'sms' | 'email',
        );
        setAuthMethod(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Authenticate with Ethereum wallet
   */
  const authWithEthWallet = useCallback(
    async (address: string, signMessage: (message: string) => Promise<string>): Promise<void> => {
      setLoading(true);
      setError(undefined);
      setAuthMethod(undefined);

      try {
        const result: AuthMethod = await authenticateWithEthWallet(address, signMessage);
        setAuthMethod(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    authWithWebAuthn,
    authWithStytch,
    authWithEthWallet,
    authMethod,
    loading,
    error,
    clearError,
  };
}
