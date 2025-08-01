import { useState, useCallback } from 'react';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { AUTH_METHOD_SCOPE } from '@lit-protocol/constants';
import { SELECTED_LIT_NETWORK } from '@/utils/user-dashboard/lit';
import { hexToBase58 } from '@/utils/user-dashboard/hexToBase58';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';

type AddPermittedActionsProps = {
  wallet: PKPEthersWallet;
  agentPKPTokenId: string;
  abilityIpfsCids: string[];
};

export const useAddPermittedActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addPermittedActions = useCallback(
    async ({ wallet, agentPKPTokenId, abilityIpfsCids }: AddPermittedActionsProps) => {
      if (!wallet || !agentPKPTokenId || !abilityIpfsCids.length) {
        setError('Missing required data for adding permitted actions');
        return;
      }

      setIsLoading(true);
      setLoadingStatus('Initializing Lit Contracts');
      setError(null);

      try {
        // Initialize Lit Contracts
        const litContracts = new LitContracts({
          network: SELECTED_LIT_NETWORK,
          signer: wallet,
        });
        await litContracts.connect();

        setLoadingStatus('Fetching App Permissions');
        const permittedActions =
          await litContracts.pkpPermissionsContractUtils.read.getPermittedActions(agentPKPTokenId);

        const permittedActionSet = new Set(
          permittedActions
            .map((cid: string) => {
              const base58Cid = hexToBase58(cid);
              return base58Cid;
            })
            .filter(Boolean),
        );

        setLoadingStatus('Granting App Permissions');
        // Process ability IPFS CIDs
        for (const ipfsCid of abilityIpfsCids) {
          if (!permittedActionSet.has(ipfsCid)) {
            await litContracts.addPermittedAction({
              ipfsId: ipfsCid,
              pkpTokenId: agentPKPTokenId,
              authMethodScopes: [AUTH_METHOD_SCOPE.SignAnything],
            });
          }
        }

        setLoadingStatus('Permissions Added Successfully');
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to add permitted actions');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { addPermittedActions, isLoading, loadingStatus, error };
};
