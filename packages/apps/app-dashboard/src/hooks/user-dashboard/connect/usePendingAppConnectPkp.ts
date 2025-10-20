import { useLocalStorage } from 'usehooks-ts';
import { IRelayPKP } from '@lit-protocol/types';

const STORAGE_KEY_PREFIX = 'pendingAppConnectAgentPkp-';

function getKey(appId: number): string {
  return `${STORAGE_KEY_PREFIX}${appId}`;
}

/**
 * Hook to manage a pending PKP for app connection.
 * Stores a PKP that was minted but couldn't yet be assigned to the app.
 */
export const usePendingAppConnectPkp = (appId: number) => {
  const [pendingPKP, setPendingPKP, clearPendingPKP] = useLocalStorage<IRelayPKP | null>(
    getKey(appId),
    null,
  );

  return {
    pendingPKP,
    setPendingPKP,
    clearPendingPKP,
  };
};
