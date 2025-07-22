import type {
  PermitAppOptions,
  UnPermitAppOptions,
  SetToolPolicyParametersOptions,
} from '../types/User';

import { decodeContractError, createContract, gasAdjustedOverrides } from '../utils';
import { getPkpTokenId } from '../utils/pkpInfo';
import { encodePermissionDataForChain } from '../utils/policyParams';

/**
 * Permits an app version for an Agent Wallet PKP token and optionally sets tool policy parameters
 * @param params
 * @param params.signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param params.args - Object containing pkpEthAddress, appId, appVersion, and permissionData in nested object format
 * @param params.overrides - Optional ethers.Override params for the transaction call (like manual gas limit)
 * @returns The transaction hash

 */
export async function permitApp(params: PermitAppOptions): Promise<{ txHash: string }> {
  const {
    signer,
    args: { pkpEthAddress, appId, appVersion, permissionData },
    overrides,
  } = params;
  const contract = createContract(signer);

  try {
    const pkpTokenId = await getPkpTokenId({ pkpEthAddress, signer });

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

/**
 * Revokes permission for a PKP to use a specific app version
 * @param params
 * @param params.signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param params.args - Object containing pkpEthAddress, appId, and appVersion
 * @param params.overrides - Optional ethers.Override params for the transaction call (like manual gas limit)
 * @returns The transaction hash

 */
export async function unPermitApp({
  signer,
  args: { pkpEthAddress, appId, appVersion },
  overrides,
}: UnPermitAppOptions): Promise<{ txHash: string }> {
  const contract = createContract(signer);

  try {
    const pkpTokenId = await getPkpTokenId({ pkpEthAddress, signer });

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

/**
 * Sets tool policy parameters for a specific app version
 * @param params
 * @param params.signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param params.args - Object containing pkpEthAddress, appId, appVersion, and policyParams in nested object format
 * @param params.overrides - Optional ethers.Override params for the transaction call (like manual gas limit)
 * @returns The transaction hash

 */
export async function setToolPolicyParameters(
  params: SetToolPolicyParametersOptions,
): Promise<{ txHash: string }> {
  const {
    signer,
    args: { appId, appVersion, pkpEthAddress, policyParams },
    overrides,
  } = params;
  const contract = createContract(signer);

  try {
    const pkpTokenId = await getPkpTokenId({ pkpEthAddress, signer });

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
