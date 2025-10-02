import { ethers } from 'ethers';

import { getAaveAddresses, getATokens } from './aave';
import { assertValidEntryPointAddress, getSmartAccountNonce } from './entryPoint';
import {
  estimateUserOperationGas,
  getUserOpInitCode,
  getUserOpVersion,
  simulateUserOp,
  UserOp,
  UserOpv060,
} from './userOperation';
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

interface ProccessUserOpParams {
  entryPointAddress: string;
  userOp: UserOp;
  rpcUrl: string;
}

export const validateUserOp = async (params: ProccessUserOpParams) => {
  const { entryPointAddress, userOp, rpcUrl } = params;
  const _userOp = { ...userOp };

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  await assertValidEntryPointAddress(entryPointAddress, provider);

  const network = await provider.detectNetwork();
  const { POOL: aavePoolAddress } = getAaveAddresses(network.chainId);
  const aaveATokens = getATokens(network.chainId);

  const userOpVersion = getUserOpVersion(_userOp);

  // Complete userOp optional fields
  if (!_userOp.nonce) {
    _userOp.nonce = ethers.utils.hexValue(
      await getSmartAccountNonce({
        entryPointAddress,
        provider,
        accountAddress: _userOp.sender,
      }),
    );
  }
  if (!_userOp.callGasLimit || !_userOp.preVerificationGas || !_userOp.verificationGasLimit) {
    const gasEst = await estimateUserOperationGas({
      entryPointAddress,
      provider,
      userOp: _userOp,
    });
    if (gasEst?.callGasLimit) _userOp.callGasLimit = gasEst.callGasLimit;
    if (gasEst?.verificationGasLimit) _userOp.verificationGasLimit = gasEst.verificationGasLimit;
    if (gasEst?.preVerificationGas) _userOp.preVerificationGas = gasEst.preVerificationGas;
  }
  if (userOpVersion === '0.6.0') {
    const _userOp060 = _userOp as UserOpv060;

    if (!('initCode' in _userOp)) {
      _userOp060.initCode = await getUserOpInitCode({
        accountAddress: _userOp.sender,
        provider,
      });
    }
  }

  // TODO Decode userOp to get token, pool and amount and validate there is nothing extra in the userOp
  // Also the calldata will define the smart account implementation for initCode

  // Simulate userOp
  const simulation = await simulateUserOp({
    provider,
    entryPoint: entryPointAddress,
    userOp: _userOp,
  });
  validateSimulation({
    aaveATokens,
    aavePoolAddress,
    simulation,
    entryPointAddress,
    userOp: _userOp,
  });

  return {
    simulationChanges: simulation.changes,
    userOp: _userOp,
  };
};
