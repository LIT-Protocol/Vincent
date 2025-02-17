import { useCallback, useState } from 'react';
import { AuthMethod } from '@lit-protocol/types';
import {
  authenticateWithEthWallet,
  authenticateWithWebAuthn,
  authenticateWithStytch,
} from '../utils/lit';
import { useConnect } from 'wagmi';

export default function useAuthenticate() {
  const [authMethod, setAuthMethod] = useState<AuthMethod>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error>();

  // wagmi hook
  const { connectAsync } = useConnect({
    onError: (err: unknown) => {
      setError(err as Error);
    },
  });

  /**
   * Authenticate with Ethereum wallet
   */
  const authWithEthWallet = useCallback(
    async (connector: any): Promise<void> => {
      setLoading(true);
      setError(undefined);
      setAuthMethod(undefined);

      try {
        const { account, connector: activeConnector } = await connectAsync(
          connector
        );
        const signer = await activeConnector!.getSigner();
        const signMessage = async (message: string) => {
          const sig = await signer.signMessage(message);
          return sig;
        };
        const result: AuthMethod = await authenticateWithEthWallet(
          account,
          signMessage
        );
        setAuthMethod(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [connectAsync]
  );

  /**
   * Authenticate with WebAuthn credential
   */
  const authWithWebAuthn = useCallback(
    async (username?: string): Promise<void> => {
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
    },
    []
  );

  /**
   * Authenticate with Stytch
   */
  const authWithStytch = useCallback(
    async (accessToken: string, userId?: string, method?: string): Promise<void> => {
      setLoading(true);
      setError(undefined);
      setAuthMethod(undefined);

      try {
        const result: AuthMethod = (await authenticateWithStytch(
          accessToken,
          userId,
          method as "sms" | "email"
        )) as any;
        setAuthMethod(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    []
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
