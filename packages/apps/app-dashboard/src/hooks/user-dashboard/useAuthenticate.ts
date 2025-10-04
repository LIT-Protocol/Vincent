import { useCallback, useState } from 'react';
import { AuthMethod } from '@lit-protocol/types';
import * as Sentry from '@sentry/react';
import {
  authenticateWithWebAuthn,
  authenticateWithStytch,
  authenticateWithEthWallet,
} from '@/utils/user-dashboard/lit';

interface AuthData {
  authMethod: AuthMethod;
  userValue: string;
}

export default function useAuthenticate() {
  const [authData, setAuthData] = useState<AuthData>();
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
    setAuthData(undefined);

    try {
      const result: AuthMethod = await authenticateWithWebAuthn();
      setAuthData({
        authMethod: result,
        userValue: '', // WebAuthn doesn't have anything here
      });
    } catch (err) {
      // Check if this is a user cancellation - if so, don't treat it as an error
      if (
        !(err instanceof Error) ||
        (!err.message.includes('timed out') &&
          !err.message.includes('not allowed') &&
          !err.message.includes('cancelled') &&
          !err.message.includes('privacy-considerations-client'))
      ) {
        setError(err as Error);
        Sentry.addBreadcrumb({
          category: 'auth.webauthn',
          message: 'WebAuthn authentication failed',
          level: 'error',
          data: {
            error: err instanceof Error ? err.message : String(err),
          },
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Authenticate with Stytch
   */
  const authWithStytch = useCallback(
    async (
      accessToken: string,
      userId?: string,
      method?: string,
      userValue?: string,
    ): Promise<void> => {
      setLoading(true);
      setError(undefined);
      setAuthData(undefined);

      try {
        const result: AuthMethod = await authenticateWithStytch(
          accessToken,
          userId,
          method as 'sms' | 'email',
        );
        setAuthData({
          authMethod: result,
          userValue: userValue || 'Unknown', // Store the email/phone provided by Stytch
        });
      } catch (err) {
        setError(err as Error);
        Sentry.addBreadcrumb({
          category: 'auth.stytch',
          message: 'Stytch authentication failed',
          level: 'error',
          data: {
            method,
            userId,
            error: err instanceof Error ? err.message : String(err),
          },
        });
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
      setAuthData(undefined);

      try {
        const result: AuthMethod = await authenticateWithEthWallet(address, signMessage);
        setAuthData({
          authMethod: result,
          userValue: address, // Use the wallet address for display
        });
      } catch (err) {
        // Don't show error for user rejection - it's not really an error
        if (
          !(err instanceof Error) ||
          (!err.message.includes('User rejected') && !err.message.includes('user rejected'))
        ) {
          setError(err as Error);
          Sentry.addBreadcrumb({
            category: 'auth.wallet',
            message: 'Ethereum wallet authentication failed',
            level: 'error',
            data: {
              address,
              error: err instanceof Error ? err.message : String(err),
            },
          });
        }
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
    authData,
    loading,
    error,
    clearError,
  };
}
