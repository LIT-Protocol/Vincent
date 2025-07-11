import { useCallback, useState } from 'react';
import { AuthMethod } from '@lit-protocol/types';
import { authenticateWithWebAuthn, authenticateWithStytch, authenticateWithEthWallet } from '../utils/lit';

export default function useAuthenticate() {
  const [authMethod, setAuthMethod] = useState<AuthMethod>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error>();

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
      setError(err as Error);
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

  return {
    authWithEthWallet,
    authWithWebAuthn,
    authWithStytch,
    authMethod,
    loading,
    error,
  };
}
