import type { ValidateSimulationParams } from '@lit-protocol/vincent-ability-sdk/gatedSigner';

import { getAddress, zeroAddress } from 'viem';

import { getAaveAddresses, getATokens } from './helpers/aave';

export const validateSimulation = (params: ValidateSimulationParams) => {
  const { chainId, sender: _sender, simulation } = params;

  if (simulation.error) {
    const { message, revertReason } = simulation.error;
    throw new Error(`Simulation failed - Reason: ${revertReason} - Message: ${message}`);
  }

  const { POOL: aavePoolAddress } = getAaveAddresses(chainId);
  const aaveATokens = getATokens(chainId);

  const sender = getAddress(_sender);
  const pool = getAddress(aavePoolAddress);
  const aTokens = Object.values(aaveATokens).map(getAddress);
  const allowed = new Set([zeroAddress, sender, pool, ...aTokens]);

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
};
