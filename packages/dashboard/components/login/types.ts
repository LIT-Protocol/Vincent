import { FC } from 'react';
import { AuthMethod } from '@lit-protocol/types';
import { IRelayPKP } from '@lit-protocol/types';

export interface AccountHookReturn {
  fetchAccounts: (authMethod: AuthMethod) => Promise<void>;
  createAccount: (authMethod: AuthMethod) => Promise<void>;
  setCurrentAccount: (account: IRelayPKP | undefined | ((prev: IRelayPKP | undefined) => IRelayPKP | undefined)) => void;
  accounts: IRelayPKP[];
  currentAccount: IRelayPKP | undefined;
  loading: boolean;
  error: Error | undefined;
  flow: 'login' | 'signup';
}

declare const ConnectButton: FC;
export { ConnectButton };

declare function useAccounts(flow?: 'login' | 'signup'): AccountHookReturn;
export { useAccounts };