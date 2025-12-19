import type {
  ValidateSimulationParams,
  SimulateAssetChangesResponse,
} from '@lit-protocol/vincent-ability-sdk/gatedSigner';

type SimulateAssetChange = SimulateAssetChangesResponse['changes'][number];

import { getAddress, zeroAddress } from 'viem';

import { fetchRelayLinkAddresses } from './helpers/relay-link';

export const validateSimulation = async (params: ValidateSimulationParams) => {
  const { chainId, sender: _sender, simulation } = params;

  if (simulation.error) {
    const { message, revertReason } = simulation.error;
    throw new Error(`Simulation failed - Reason: ${revertReason} - Message: ${message}`);
  }

  // Fetch Relay contract addresses from the API
  const relayAddresses = await fetchRelayLinkAddresses(chainId);
  const sender = getAddress(_sender, chainId);

  // Build set of allowed addresses: sender, zero address, and all Relay.link contracts
  const relayAddressesNormalized = relayAddresses.map((a) => getAddress(a, chainId));
  const allowed = new Set([zeroAddress, sender, ...relayAddressesNormalized]);

  simulation.changes.forEach((c: SimulateAssetChange, idx: number) => {
    const assetType = c.assetType;
    const changeType = c.changeType;
    const from = getAddress(c.from, chainId);
    const to = getAddress(c.to, chainId);

    // Helper for throwing with context
    const fail = (reason: string) => {
      throw new Error(
        `Invalid simulation change at index ${idx}: ${reason} [assetType=${assetType}, changeType=${changeType}, from=${from}, to=${to}]`,
      );
    };

    if (assetType === 'NATIVE') {
      if (changeType !== 'TRANSFER') {
        fail('Only TRANSFER is allowed for NATIVE');
      }
      // Native transfers are allowed (e.g., sending ETH to Relay for swap)
      return;
    }

    if (assetType === 'ERC20') {
      if (changeType === 'APPROVE') {
        // We only validate approvals FROM the sender to ensure user tokens aren't
        // approved to malicious contracts. Intermediate approvals (from DEX aggregators,
        // routers, or other contracts in the swap route) are orchestrated by Relay.link
        // and don't affect the user's tokens directly.
        if (from === sender) {
          // Sender's approvals must go to known Relay.link contracts
          const isToRelay = relayAddressesNormalized.some((addr) => addr === to);
          if (!isToRelay) {
            fail('ERC20 APPROVE from sender must go to a Relay.link contract');
          }
        }
        // Approvals from other addresses (intermediate contracts) are allowed
        // as they're part of Relay.link's swap orchestration
        return;
      }

      if (changeType === 'TRANSFER') {
        // For transfers FROM sender, ensure they go to allowed addresses (Relay contracts)
        // For transfers TO sender, they're always allowed (receiving funds)
        // Intermediate transfers (between aggregator contracts) are allowed since Relay orchestrates them
        if (from === sender && !allowed.has(to)) {
          fail('ERC20 TRANSFER from sender must go to a Relay.link contract');
        }
        // Transfers to sender are always allowed (receiving swap output)
        // Intermediate transfers (neither from nor to sender) are allowed as Relay uses aggregators
        return;
      }

      // Unknown change type for ERC20
      fail('Unsupported ERC20 change type');
    }

    // Any other asset types are not permitted
    fail('Unsupported asset type');
  });
};
