import { useCallback, useState, useEffect, Dispatch, SetStateAction } from 'react';
import { AuthMethod } from '@lit-protocol/types';
import { getPKPs, mintPKP } from '../utils/lit';
import { IRelayPKP } from '@lit-protocol/types';
import { useSessionStorage } from './useSessionStorage';

type FlowType = 'login' | 'signup';

// Shared state at module level
let sharedAccounts: IRelayPKP[] = [];
let sharedCurrentAccount: IRelayPKP | undefined;
let sharedLoading = false;
let sharedError: Error | undefined;

// Keep track of all state update listeners
const listeners = new Set<(account: IRelayPKP | undefined) => void>();

interface AccountHookReturn {
  fetchAccounts: (authMethod: AuthMethod) => Promise<void>;
  createAccount: (authMethod: AuthMethod) => Promise<void>;
  setCurrentAccount: Dispatch<SetStateAction<IRelayPKP | undefined>>;
  accounts: IRelayPKP[];
  currentAccount: IRelayPKP | undefined;
  loading: boolean;
  error: Error | undefined;
  flow: FlowType;
}

export default function useAccounts(flow: FlowType): AccountHookReturn {
  const [accounts, setAccounts] = useState<IRelayPKP[]>(sharedAccounts);
  const [currentAccount, setCurrentAccount] = useState<IRelayPKP | undefined>(sharedCurrentAccount);
  const [loading, setLoading] = useState<boolean>(sharedLoading);
  const [error, setError] = useState<Error | undefined>(sharedError);
  const { sessionData, storeSession } = useSessionStorage();

  // Load stored session on mount
  useEffect(() => {
    if (sessionData.pkp) {
      sharedCurrentAccount = sessionData.pkp;
      setCurrentAccount(sessionData.pkp);
    }
  }, [sessionData]);

  // Add listener when component mounts
  useEffect(() => {
    const listener = (account: IRelayPKP | undefined) => {
      setCurrentAccount(account);
    };
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  /**
   * Fetch PKPs tied to given auth method
   */
  const fetchAccounts = useCallback(
    async (authMethod: AuthMethod): Promise<void> => {
      if (flow === 'signup') {
        return;
      }

      sharedLoading = true;
      setLoading(true);
      sharedError = undefined;
      setError(undefined);
      try {
        const myPKPs = await getPKPs(authMethod);
        console.log('Fetched PKPs:', myPKPs);
        sharedAccounts = myPKPs;
        setAccounts(myPKPs);
        if (myPKPs.length === 1) {
          sharedCurrentAccount = myPKPs[0];
          setCurrentAccount(myPKPs[0]);
          storeSession(authMethod, myPKPs[0]);
          // Notify all listeners
          listeners.forEach(listener => listener(myPKPs[0]));
        }
      } catch (err) {
        console.error('Error fetching accounts:', err);
        sharedError = err as Error;
        setError(err as Error);
      } finally {
        sharedLoading = false;
        setLoading(false);
      }
    },
    [flow, storeSession]
  );

  /**
   * Create a new PKP for the given auth method
   */
  const createAccount = useCallback(
    async (authMethod: AuthMethod): Promise<void> => {
      if (flow === 'login') {
        return;
      }

      sharedLoading = true;
      setLoading(true);
      sharedError = undefined;
      setError(undefined);
      try {
        const newPKP = await mintPKP(authMethod);
        sharedCurrentAccount = newPKP;
        setCurrentAccount(newPKP);
        storeSession(authMethod, newPKP);
        // Notify all listeners
        listeners.forEach(listener => listener(newPKP));
      } catch (err) {
        console.error('Error creating account:', err);
        sharedError = err as Error;
        setError(err as Error);
      } finally {
        sharedLoading = false;
        setLoading(false);
      }
    },
    [flow, storeSession]
  );

  // Custom setCurrentAccount that updates both local and shared state
  const customSetCurrentAccount = useCallback((newAccount: IRelayPKP | undefined | ((prev: IRelayPKP | undefined) => IRelayPKP | undefined)) => {
    const resolvedAccount = typeof newAccount === 'function' ? newAccount(currentAccount) : newAccount;
    sharedCurrentAccount = resolvedAccount;
    setCurrentAccount(resolvedAccount);
    // Notify all listeners
    listeners.forEach(listener => listener(resolvedAccount));
  }, [currentAccount]);

  // Update shared state when local state changes
  useEffect(() => {
    sharedAccounts = accounts;
  }, [accounts]);

  useEffect(() => {
    sharedError = error;
  }, [error]);

  useEffect(() => {
    sharedLoading = loading;
  }, [loading]);

  return {
    fetchAccounts,
    createAccount,
    setCurrentAccount: customSetCurrentAccount,
    accounts,
    currentAccount,
    loading,
    error,
    flow,
  };
}
