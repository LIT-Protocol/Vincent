import { Address, createPublicClient, http, zeroAddress } from 'viem';

import { getAaveAddresses, getATokens } from './aave';
import { decodeUserOp } from './decoding';
import { assertValidEntryPointAddress } from './entryPoint';
import { UserOp } from './userOperation';
import { SimulateUserOperationAssetChangesResponse, simulateUserOp } from './simulation';

interface ValidateSimulationParams {
  aaveATokens: Record<string, string>;
  aavePoolAddress: Address;
  entryPointAddress: Address;
  simulation: SimulateUserOperationAssetChangesResponse;
  userOp: UserOp;
}

export const validateSimulation = ({
  aaveATokens,
  aavePoolAddress,
  entryPointAddress,
  simulation,
  userOp,
}: ValidateSimulationParams) => {
  if (simulation.error) {
    const { message, revertReason } = simulation.error;
    throw new Error(`Simulation failed - Reason: ${revertReason} - Message: ${message}`);
  }

  const sender = userOp.sender.toLowerCase();
  const entryPoint = entryPointAddress.toLowerCase();
  const pool = aavePoolAddress.toLowerCase();
  const aTokens = Object.values(aaveATokens).map((aToken) => aToken.toLowerCase());
  const allowed = new Set([zeroAddress, sender, pool, ...aTokens]);

  simulation.changes.forEach((c, idx) => {
    const assetType = c.assetType;
    const changeType = c.changeType;
    const from = c.from.toLowerCase();
    const to = c.to.toLowerCase();

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
      if (from !== sender || to !== entryPoint) {
        fail('Native transfer must be from userOp.sender to entryPointAddress');
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
        if (!allowed.has(from!) || !allowed.has(to!)) {
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

  // Decode userOp to ensure bundled txs are allowed
  const decodeResult = await decodeUserOp({
    aaveATokens,
    aavePoolAddress,
    entryPointAddress,
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
    entryPointAddress,
    simulation,
    userOp,
  });

  return {
    userOp,
    simulationChanges: simulation.changes,
  };
};
