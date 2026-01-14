import type {
  ValidateSimulationParams,
  SimulateAssetChangesResponse,
} from '@lit-protocol/vincent-ability-sdk/gatedSigner';
import { type Address, getAddress, zeroAddress } from 'viem';

import { fetchRelayLinkAddresses } from './helpers/relay-link';

type SimulateAssetChange = SimulateAssetChangesResponse['changes'][number];

// Fixed Relay Solver address for EVM chains
// See: https://docs.relay.link/references/solver-addresses
const RELAY_SOLVER_ADDRESS = '0xf70da97812cb96acdf810712aa562db8dfa3dbef' as Address;

// Fee range in basis points (1 bps = 0.01%)
const MIN_FEE_BPS = 0n; // 0%
const MAX_FEE_BPS = 100n; // 1%

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

  // Normalize the solver address for comparison
  const solverAddress = getAddress(RELAY_SOLVER_ADDRESS, chainId);

  // Track input amounts per token (ERC20 transfers FROM sender)
  const inputByToken = new Map<Address, bigint>();
  // Track fee amounts per token (ERC20 transfers TO the Relay Solver)
  const feesByToken = new Map<Address, bigint>();

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

      // Track native input (from sender) - use zeroAddress as the "token" for native ETH
      if (from === sender && c.rawAmount) {
        inputByToken.set(zeroAddress, (inputByToken.get(zeroAddress) || 0n) + BigInt(c.rawAmount));
      }

      // Track native fee (to solver)
      if (to === solverAddress && c.rawAmount) {
        feesByToken.set(zeroAddress, (feesByToken.get(zeroAddress) || 0n) + BigInt(c.rawAmount));
      }

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

        // Track input amounts (transfers FROM sender)
        if (from === sender && c.contractAddress && c.rawAmount) {
          const token = getAddress(c.contractAddress, chainId);
          const amount = BigInt(c.rawAmount);
          inputByToken.set(token, (inputByToken.get(token) || 0n) + amount);
        }

        // Track fee amounts (transfers TO the Relay Solver)
        if (to === solverAddress && c.contractAddress && c.rawAmount) {
          const token = getAddress(c.contractAddress, chainId);
          const amount = BigInt(c.rawAmount);
          feesByToken.set(token, (feesByToken.get(token) || 0n) + amount);
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

  // Validate fee percentages for tokens where we detected both input and fees
  for (const [token, feeAmount] of feesByToken) {
    const inputAmount = inputByToken.get(token);

    // Only validate if we have input for this token (otherwise we can't calculate a percentage)
    if (inputAmount && inputAmount > 0n) {
      // Calculate fee in basis points: (fee / input) * 10000
      const feeBps = (feeAmount * 10000n) / inputAmount;

      if (feeBps < MIN_FEE_BPS) {
        throw new Error(
          `Fee too low: ${feeBps} bps for token ${token}. Minimum allowed: ${MIN_FEE_BPS} bps`,
        );
      }

      if (feeBps > MAX_FEE_BPS) {
        throw new Error(
          `Fee too high: ${feeBps} bps for token ${token}. Maximum allowed: ${MAX_FEE_BPS} bps`,
        );
      }
    }
  }
};
