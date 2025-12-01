import { Address, createPublicClient, getAddress, http } from 'viem';

import { getRelayLinkExecuteAddresses } from './relayLink';
import { decodeTransaction, decodeUserOp } from './decoding';
import { assertValidEntryPointAddress } from './entryPoint';
import { Transaction } from './transaction';
import { UserOp } from './userOperation';
import {
  SimulateUserOperationAssetChangesResponse,
  simulateTransaction,
  simulateUserOp,
} from './simulation';

interface ValidateSimulationParams {
  relayLinkExecuteAddresses: Address[];
  senderAddress: Address;
  allowedNativeRecipients: Address[];
  additionalAllowedAddresses?: Address[];
  simulation: SimulateUserOperationAssetChangesResponse;
}

export const validateSimulation = ({
  relayLinkExecuteAddresses,
  senderAddress,
  allowedNativeRecipients,
  simulation,
}: ValidateSimulationParams) => {
  if (simulation.error) {
    const { message, revertReason } = simulation.error;
    throw new Error(`Simulation failed - Reason: ${revertReason} - Message: ${message}`);
  }

  if (!allowedNativeRecipients.length) {
    throw new Error('validateSimulation requires at least one allowed native recipient');
  }

  const sender = getAddress(senderAddress).toLowerCase();
  // Normalize all addresses to lowercase for consistent comparison
  const nativeRecipients = new Set(
    allowedNativeRecipients.map((addr) => getAddress(addr).toLowerCase()),
  );
  const relayLinkAddresses = new Set(
    relayLinkExecuteAddresses.map((addr) => getAddress(addr).toLowerCase()),
  );

  simulation.changes.forEach((c, idx) => {
    const assetType = c.assetType;
    const changeType = c.changeType;
    const from = getAddress(c.from).toLowerCase();
    const to = getAddress(c.to).toLowerCase();

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
      // For Relay.link swaps, allow:
      // 1. Transfers from sender to Relay.link (initial deposit)
      // 2. Any other native transfers (swap execution through DEXs, routers, etc.)
      // The simulation already validates the transaction will execute correctly
      if (from === sender) {
        if (!nativeRecipients.has(to)) {
          fail('Native transfer from sender must be to an allowed recipient');
        }
      }
      // All other native transfers are allowed (part of swap execution)
      return;
    }

    if (assetType === 'ERC20') {
      if (changeType === 'APPROVE') {
        // Only validate approvals from the sender
        if (from === sender && !relayLinkAddresses.has(to)) {
          fail('ERC20 APPROVE from sender must be to Relay.link execute contract');
        }
        // All other approvals are allowed (part of swap execution)
        return;
      }
      if (changeType === 'TRANSFER') {
        // For swaps, allow any ERC20 transfers
        // The simulation already validates the transaction will execute correctly
        return;
      }

      // Unknown change type for ERC20
      fail('Unsupported ERC20 change type');
    }

    // Any other asset types are not permitted
    fail('Unsupported asset type');
  });

  return true;
};

interface ProccessUserOpParams {
  alchemyRpcUrl: string;
  entryPointAddress: Address;
  userOp: UserOp;
}

export const validateUserOp = async (params: ProccessUserOpParams) => {
  const { alchemyRpcUrl, entryPointAddress, userOp } = params;

  const publicClient = createPublicClient({
    transport: http(alchemyRpcUrl),
  });
  const chainId = await publicClient.getChainId();

  await assertValidEntryPointAddress(entryPointAddress, publicClient);

  const relayLinkExecuteAddresses = getRelayLinkExecuteAddresses(chainId);
  const relayLinkExecuteAddress = relayLinkExecuteAddresses[0];

  // Decode userOp to ensure bundled txs are allowed
  const decodeResult = await decodeUserOp({
    relayLinkExecuteAddress,
    userOp,
  });
  if (!decodeResult.ok) {
    throw new Error(`User operation calldata decoding failed: Errors: ${decodeResult.reasons}`);
  }

  // Extract target addresses from decoded calls - these are allowed as native transfer recipients
  const decodedTargets = decodeResult.targets || [];

  // Simulate userOp and validate changes
  const simulation = await simulateUserOp({
    publicClient,
    userOp,
    entryPoint: entryPointAddress,
  });

  validateSimulation({
    relayLinkExecuteAddresses,
    senderAddress: getAddress(userOp.sender),
    allowedNativeRecipients: [entryPointAddress, ...relayLinkExecuteAddresses, ...decodedTargets],
    additionalAllowedAddresses: [entryPointAddress],
    simulation,
  });

  return {
    simulationChanges: simulation.changes,
  };
};

interface ProcessTransactionParams {
  alchemyRpcUrl: string;
  transaction: Transaction;
  allowedTargets?: string[];
}

export async function validateTransaction({
  alchemyRpcUrl,
  transaction,
  allowedTargets = [],
}: ProcessTransactionParams) {
  const publicClient = createPublicClient({
    transport: http(alchemyRpcUrl),
  });
  const chainId = await publicClient.getChainId();

  const relayLinkExecuteAddresses = getRelayLinkExecuteAddresses(chainId);
  const relayLinkExecuteAddress = relayLinkExecuteAddresses[0];

  if (!transaction.from) {
    throw new Error('Transaction "from" address is required');
  }
  const senderAddress = getAddress(transaction.from);

  // Convert allowedTargets to Address type
  const additionalAllowedTargets = allowedTargets.map((addr) => getAddress(addr));

  const decodeResult = decodeTransaction({
    relayLinkExecuteAddress,
    transaction,
    chainId,
    additionalAllowedTargets,
  });
  if (!decodeResult.ok) {
    throw new Error(`Transaction calldata decoding failed: Errors: ${decodeResult.reasons}`);
  }

  const simulation = await simulateTransaction({
    publicClient,
    transaction,
  });

  const transactionTarget = getAddress(transaction.to);

  validateSimulation({
    relayLinkExecuteAddresses,
    senderAddress,
    allowedNativeRecipients: [transactionTarget, ...relayLinkExecuteAddresses],
    simulation,
  });

  return {
    simulationChanges: simulation.changes,
  };
}
