import { type UserOp } from './userOperation';
import { SimulateUserOperationAssetChangesResponse } from './simulation';

interface ValidateSimulationParams {
  aaveATokens: Record<string, string>;
  aavePoolAddress: string;
  entryPointAddress: string;
  simulation: SimulateUserOperationAssetChangesResponse;
  userOp: UserOp;
}

const ZERO = '0x0000000000000000000000000000000000000000';

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
  const allowed = new Set([ZERO, sender, pool, ...aTokens]);

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
