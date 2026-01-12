import type {
  PermitAppOptions,
  UnPermitAppOptions,
  RePermitAppOptions,
  SetAbilityPolicyParametersOptions,
} from './types';

import { decodeContractError, gasAdjustedOverrides } from '../../utils';
import { encodePermissionDataForChain } from '../../utils/policyParams';

export async function permitApp(params: PermitAppOptions): Promise<{ txHash: string }> {
  const {
    contract,
    args: { agentAddress, pkpSigner, pkpSignerPubKey, appId, appVersion, permissionData },
    overrides,
  } = params;

  try {
    const flattenedParams = encodePermissionDataForChain(permissionData);

    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'permitAppVersion',
      [
        agentAddress,
        pkpSigner,
        pkpSignerPubKey,
        appId,
        appVersion,
        flattenedParams.abilityIpfsCids,
        flattenedParams.policyIpfsCids,
        flattenedParams.policyParameterValues,
      ],
      overrides,
    );

    const tx = await contract.permitAppVersion(
      agentAddress,
      pkpSigner,
      pkpSignerPubKey,
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
  args: { agentAddress, appId, appVersion },
  overrides,
}: UnPermitAppOptions): Promise<{ txHash: string }> {
  try {
    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'unPermitAppVersion',
      [agentAddress, appId, appVersion],
      overrides,
    );

    const tx = await contract.unPermitAppVersion(agentAddress, appId, appVersion, {
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
    args: { agentAddress, appId },
    overrides,
  } = params;

  try {
    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'rePermitApp',
      [agentAddress, appId],
      overrides,
    );

    const tx = await contract.rePermitApp(agentAddress, appId, {
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
    args: { appId, appVersion, agentAddress, policyParams, deletePermissionData },
    overrides,
  } = params;

  try {
    const flattenedParams = encodePermissionDataForChain(policyParams, deletePermissionData);

    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'setAbilityPolicyParameters',
      [
        agentAddress,
        appId,
        appVersion,
        flattenedParams.abilityIpfsCids,
        flattenedParams.policyIpfsCids,
        flattenedParams.policyParameterValues,
      ],
      overrides,
    );

    const tx = await contract.setAbilityPolicyParameters(
      agentAddress,
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
