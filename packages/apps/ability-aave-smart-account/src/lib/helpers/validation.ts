import { Address, createPublicClient, getAddress, http, zeroAddress } from 'viem';

import { getAaveAddresses, getATokens, getFeeContractAddress } from './aave';
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
  aaveATokens: Record<string, string>;
  aavePoolAddress: Address;
  senderAddress: Address;
  allowedNativeRecipients: Address[];
  additionalAllowedAddresses?: Address[];
  simulation: SimulateUserOperationAssetChangesResponse;
}

export const validateSimulation = ({
  aaveATokens,
  aavePoolAddress,
  senderAddress,
  allowedNativeRecipients,
  additionalAllowedAddresses = [],
  simulation,
}: ValidateSimulationParams) => {
  if (simulation.error) {
    const { message, revertReason } = simulation.error;
    throw new Error(`Simulation failed - Reason: ${revertReason} - Message: ${message}`);
  }

  if (!allowedNativeRecipients.length) {
    throw new Error('validateSimulation requires at least one allowed native recipient');
  }

  const sender = getAddress(senderAddress);
  const nativeRecipients = new Set(allowedNativeRecipients.map(getAddress));
  const pool = getAddress(aavePoolAddress);
  const aTokens = Object.values(aaveATokens).map(getAddress);
  const allowed = new Set([
    zeroAddress,
    sender,
    pool,
    ...aTokens,
    ...additionalAllowedAddresses.map(getAddress),
  ]);

  simulation.changes.forEach((c, idx) => {
    const assetType = c.assetType;
    const changeType = c.changeType;
    const from = getAddress(c.from);
    const to = getAddress(c.to);

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
      if (from !== sender || !nativeRecipients.has(to)) {
        fail('Native transfer must be from sender to an allowed recipient');
      }
      return;
    }

    if (assetType === 'ERC20') {
      if (changeType === 'APPROVE') {
        if (from !== sender || to !== pool) {
          fail('ERC20 APPROVE must be from userOp.sender to aavePoolAddress');
        }
        return;
      }
      if (changeType === 'TRANSFER') {
        if (!allowed.has(from) || !allowed.has(to)) {
          fail(
            'ERC20 TRANSFER endpoints must be within {zero address, userOp.sender or Aave addresses}',
          );
        }
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

  const { POOL: aavePoolAddress } = getAaveAddresses(chainId);
  const aaveATokens = getATokens(chainId);
  const feeContractAddress = getFeeContractAddress(chainId);

  // Decode userOp to ensure bundled txs are allowed
  const decodeResult = await decodeUserOp({
    aavePoolAddress,
    feeContractAddress,
    userOp,
  });
  if (!decodeResult.ok) {
    throw new Error(`User operation calldata decoding failed: Errors: ${decodeResult.reasons}`);
  }

  // Simulate userOp and validate changes
  const simulation = await simulateUserOp({
    publicClient,
    userOp,
    entryPoint: entryPointAddress,
  });
  validateSimulation({
    aaveATokens,
    aavePoolAddress,
    senderAddress: getAddress(userOp.sender),
    allowedNativeRecipients: [entryPointAddress],
    additionalAllowedAddresses: feeContractAddress
      ? [entryPointAddress, feeContractAddress]
      : [entryPointAddress],
    simulation,
  });

  return {
    simulationChanges: simulation.changes,
  };
};

interface ProcessTransactionParams {
  alchemyRpcUrl: string;
  transaction: Transaction;
}

export async function validateTransaction({
  alchemyRpcUrl,
  transaction,
}: ProcessTransactionParams) {
  const publicClient = createPublicClient({
    transport: http(alchemyRpcUrl),
  });
  const chainId = await publicClient.getChainId();

  const { POOL: aavePoolAddress } = getAaveAddresses(chainId);
  const aaveATokens = getATokens(chainId);
  const feeContractAddress = getFeeContractAddress(chainId);

  if (!transaction.from) {
    throw new Error('Transaction "from" address is required');
  }
  const senderAddress = getAddress(transaction.from);

  const decodeResult = decodeTransaction({
    aavePoolAddress,
    feeContractAddress,
    transaction,
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
    aaveATokens,
    aavePoolAddress,
    senderAddress,
    allowedNativeRecipients: [transactionTarget],
    additionalAllowedAddresses: feeContractAddress ? [feeContractAddress] : [],
    simulation,
  });

  return {
    simulationChanges: simulation.changes,
  };
}
