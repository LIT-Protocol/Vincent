import type {
  PermitAppOptions,
  UnPermitAppOptions,
  RePermitAppOptions,
  SetAbilityPolicyParametersOptions,
} from './types';

import { decodeContractError, gasAdjustedOverrides } from '../../utils';
import { getPkpTokenId } from '../../utils/pkpInfo';
import { encodePermissionDataForChain } from '../../utils/policyParams';

export async function permitApp(params: PermitAppOptions): Promise<{ txHash: string }> {
  const {
    contract,
    args: { pkpEthAddress, appId, appVersion, permissionData },
    overrides,
  } = params;

  try {
    const pkpTokenId = await getPkpTokenId({ pkpEthAddress, signer: contract.signer });

    const flattenedParams = encodePermissionDataForChain(permissionData);

    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'permitAppVersion',
      [
        pkpTokenId,
        appId,
        appVersion,
        flattenedParams.abilityIpfsCids,
        flattenedParams.policyIpfsCids,
        flattenedParams.policyParameterValues,
      ],
      overrides,
    );

    const tx = await contract.permitAppVersion(
      pkpTokenId,
      appId,
      appVersion,
      flattenedParams.abilityIpfsCids,
      flattenedParams.policyIpfsCids,
      flattenedParams.policyParameterValues,
      {
        ...adjustedOverrides,
      },
    );
    await tx.wait();

    return {
      txHash: tx.hash,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Permit App: ${decodedError}`);
  }
}

export async function unPermitApp({
  contract,
  args: { pkpEthAddress, appId, appVersion },
  overrides,
}: UnPermitAppOptions): Promise<{ txHash: string }> {
  try {
    const pkpTokenId = await getPkpTokenId({ pkpEthAddress, signer: contract.signer });

    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'unPermitAppVersion',
      [pkpTokenId, appId, appVersion],
      overrides,
    );

    const tx = await contract.unPermitAppVersion(pkpTokenId, appId, appVersion, {
      ...adjustedOverrides,
    });
    await tx.wait();

    return {
      txHash: tx.hash,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to UnPermit App: ${decodedError}`);
  }
}

export async function rePermitApp(params: RePermitAppOptions): Promise<{ txHash: string }> {
  const {
    contract,
    args: { pkpEthAddress, appId },
    overrides,
  } = params;

  try {
    const pkpTokenId = await getPkpTokenId({ pkpEthAddress, signer: contract.signer });

    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'rePermitApp',
      [pkpTokenId, appId],
      overrides,
    );

    const tx = await contract.rePermitApp(pkpTokenId, appId, {
      ...adjustedOverrides,
    });
    await tx.wait();

    return {
      txHash: tx.hash,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Re-Permit App: ${decodedError}`);
  }
}

export async function setAbilityPolicyParameters(
  params: SetAbilityPolicyParametersOptions,
): Promise<{ txHash: string }> {
  const {
    contract,
    args: { appId, appVersion, pkpEthAddress, policyParams, deletePermissionData },
    overrides,
  } = params;

  try {
    const pkpTokenId = await getPkpTokenId({ pkpEthAddress, signer: contract.signer });

    const flattenedParams = encodePermissionDataForChain(policyParams, deletePermissionData);

    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'setAbilityPolicyParameters',
      [
        pkpTokenId,
        appId,
        appVersion,
        flattenedParams.abilityIpfsCids,
        flattenedParams.policyIpfsCids,
        flattenedParams.policyParameterValues,
      ],
      overrides,
    );

    const tx = await contract.setAbilityPolicyParameters(
      pkpTokenId,
      appId,
      appVersion,
      flattenedParams.abilityIpfsCids,
      flattenedParams.policyIpfsCids,
      flattenedParams.policyParameterValues,
      {
        ...adjustedOverrides,
      },
    );
    await tx.wait();

    return {
      txHash: tx.hash,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Set Ability Policy Parameters: ${decodedError}`);
  }
}
