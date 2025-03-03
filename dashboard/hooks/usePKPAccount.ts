import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IRelayPKP } from '@lit-protocol/types';

interface PKPAccountState {
  currentAccount: IRelayPKP | undefined;
  setCurrentAccount: (account: IRelayPKP | undefined) => void;
}

export const usePKPAccount = create<PKPAccountState>()(
  persist(
    (set) => ({
      currentAccount: undefined,
      setCurrentAccount: (account) => set({ currentAccount: account }),
    }),
    {
      name: 'pkp-account-storage', // name of the item in localStorage
    }
  )
); 