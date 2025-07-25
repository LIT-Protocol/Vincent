import type { PermitAppOptions, UnPermitAppOptions, SetToolPolicyParametersOptions } from './types';

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
        flattenedParams.toolIpfsCids,
        flattenedParams.policyIpfsCids,
        flattenedParams.policyParameterValues,
      ],
      overrides,
    );

    const tx = await contract.permitAppVersion(
      pkpTokenId,
      appId,
      appVersion,
      flattenedParams.toolIpfsCids,
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

export async function setToolPolicyParameters(
  params: SetToolPolicyParametersOptions,
): Promise<{ txHash: string }> {
  const {
    contract,
    args: { appId, appVersion, pkpEthAddress, policyParams },
    overrides,
  } = params;

  try {
    const pkpTokenId = await getPkpTokenId({ pkpEthAddress, signer: contract.signer });

    const flattenedParams = encodePermissionDataForChain(policyParams);

    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'setToolPolicyParameters',
      [
        pkpTokenId,
        appId,
        appVersion,
        flattenedParams.toolIpfsCids,
        flattenedParams.policyIpfsCids,
        flattenedParams.policyParameterValues,
      ],
      overrides,
    );

    const tx = await contract.setToolPolicyParameters(
      pkpTokenId,
      appId,
      appVersion,
      flattenedParams.toolIpfsCids,
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
    throw new Error(`Failed to Set Tool Policy Parameters: ${decodedError}`);
  }
}
