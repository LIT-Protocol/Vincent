import { useCallback, useState } from 'react';
import { AuthMethod } from '@lit-protocol/types';
import { getOrMintPKPs, mintPKP } from '../utils/lit';
import { IRelayPKP } from '@lit-protocol/types';

export default function useAccounts() {
  const [accounts, setAccounts] = useState<IRelayPKP[]>([]);
  const [userPKP, setuserPKP] = useState<IRelayPKP>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error>();

  /**
   * Fetch PKPs tied to given auth method
   */
  const fetchAccounts = useCallback(
    async (authMethod: AuthMethod): Promise<void> => {
      setLoading(true);
      setError(undefined);
      try {
        // Fetch PKPs tied to given auth method
        const myPKPs = await getOrMintPKPs(authMethod);
        // console.log('fetchAccounts pkps: ', myPKPs);
        setAccounts(myPKPs);
        // If only one PKP, set as current account
        if (myPKPs.length === 1) {
          setuserPKP(myPKPs[0]);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Mint a new PKP for current auth method
   */
  const createAccount = useCallback(
    async (authMethod: AuthMethod): Promise<void> => {
      setLoading(true);
      setError(undefined);
      try {
        const newPKP = await mintPKP(authMethod);

        // console.log('createAccount pkp: ', newPKP);
        setAccounts(prev => [...prev, newPKP]);
        setuserPKP(newPKP);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    fetchAccounts,
    createAccount,
    setuserPKP,
    accounts,
    userPKP,
    loading,
    error,
  };
}
