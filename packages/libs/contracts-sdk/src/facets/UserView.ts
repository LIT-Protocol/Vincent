import type { BigNumber } from 'ethers';

import type { ToolWithPolicies, ToolExecutionValidation } from '../types/internal';
import type {
  GetAllRegisteredAgentPkpsOptions,
  GetPermittedAppVersionForPkpOptions,
  GetAllPermittedAppIdsForPkpOptions,
  GetAllToolsAndPoliciesForAppOptions,
  ValidateToolExecutionAndGetPoliciesOptions,
  PermissionData,
  ToolPolicyParameterData,
  ValidateToolExecutionAndGetPoliciesResult,
} from '../types/User';

import { decodeContractError, createContract } from '../utils';
import { getPkpEthAddress, getPkpTokenId } from '../utils/pkpInfo';
import {
  decodePermissionDataFromChain,
  decodePolicyParametersFromChain,
} from '../utils/policyParams';

/**
 * Get all PKP tokens that are registered as agents for a specific user address
 * @param params
 * @param params.signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param params.args - Object containing userAddress
 *
 * @returns Array of PKP eth addresses that are registered as agents for the user. Empty array if none found.
 */
export async function getAllRegisteredAgentPkpEthAddresses(
  params: GetAllRegisteredAgentPkpsOptions,
): Promise<string[]> {
  const {
    signer,
    args: { userPkpAddress },
  } = params;
  const contract = createContract(signer);

  try {
    const pkpTokenIds: BigNumber[] = await contract.getAllRegisteredAgentPkps(userPkpAddress);

    const pkpEthAdddresses: string[] = [];
    for (const tokenId of pkpTokenIds) {
      const pkpEthAddress = await getPkpEthAddress({ signer, tokenId });
      pkpEthAdddresses.push(pkpEthAddress);
    }
    return pkpEthAdddresses;
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);

    if (decodedError.includes('NoRegisteredPkpsFound')) {
      return [];
    }

    throw new Error(`Failed to Get All Registered Agent PKPs: ${decodedError}`);
  }
}

/**
 * Get the permitted app version for a specific PKP token and app
 * @param params
 * @param params.signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param params.args - Object containing pkpEthAddress and appId
 * @returns The permitted app version for the PKP token and app
 */
export async function getPermittedAppVersionForPkp(
  params: GetPermittedAppVersionForPkpOptions,
): Promise<number | null> {
  const {
    signer,
    args: { pkpEthAddress, appId },
  } = params;
  const contract = createContract(signer);

  try {
    const pkpTokenId = await getPkpTokenId({ pkpEthAddress, signer });

    const appVersion: BigNumber = await contract.getPermittedAppVersionForPkp(pkpTokenId, appId);

    if (!appVersion) return null;

    return appVersion.toNumber();
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get Permitted App Version For PKP: ${decodedError}`);
  }
}

/**
 * Get all app IDs that have permissions for a specific PKP token, excluding deleted apps
 * @param params
 * @param params.signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param params.args - Object containing pkpEthAddress
 * @returns Array of app IDs that have permissions for the PKP token and haven't been deleted
 */
export async function getAllPermittedAppIdsForPkp(
  params: GetAllPermittedAppIdsForPkpOptions,
): Promise<number[]> {
  const {
    signer,
    args: { pkpEthAddress },
  } = params;
  const contract = createContract(signer);

  try {
    const pkpTokenId = await getPkpTokenId({ pkpEthAddress, signer });

    const appIds: BigNumber[] = await contract.getAllPermittedAppIdsForPkp(pkpTokenId);

    return appIds.map((appId) => appId.toNumber());
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get All Permitted App IDs For PKP: ${decodedError}`);
  }
}

/**
 * Get all permitted tools, policies, and policy parameters for a specific app and PKP in a nested object structure
 * @param params
 * @param params.signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param params.args - Object containing pkpEthAddress and appId
 * @returns Nested object structure where keys are tool IPFS CIDs and values are objects with policy IPFS CIDs as keys
 */
export async function getAllToolsAndPoliciesForApp(
  params: GetAllToolsAndPoliciesForAppOptions,
): Promise<PermissionData> {
  const {
    signer,
    args: { pkpEthAddress, appId },
  } = params;
  const contract = createContract(signer);

  try {
    const pkpTokenId = await getPkpTokenId({ pkpEthAddress, signer });

    const tools: ToolWithPolicies[] = await contract.getAllToolsAndPoliciesForApp(
      pkpTokenId,
      appId,
    );

    return decodePermissionDataFromChain(tools);
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get All Tools And Policies For App: ${decodedError}`);
  }
}

/**
 * Validates tool execution and gets policies for a specific tool
 * @param params
 * @param params.signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param params.args - Object containing delegateeAddress, pkpEthAddress, and toolIpfsCid
 * @returns Object containing validation result with isPermitted, appId, appVersion, and policies
 */
export async function validateToolExecutionAndGetPolicies(
  params: ValidateToolExecutionAndGetPoliciesOptions,
): Promise<ValidateToolExecutionAndGetPoliciesResult> {
  const {
    signer,
    args: { delegateeAddress, pkpEthAddress, toolIpfsCid },
  } = params;

  const contract = createContract(signer);

  try {
    const pkpTokenId = await getPkpTokenId({ pkpEthAddress, signer });

    const validationResult: ToolExecutionValidation =
      await contract.validateToolExecutionAndGetPolicies(delegateeAddress, pkpTokenId, toolIpfsCid);

    const decodedPolicies: ToolPolicyParameterData = {};

    for (const policy of validationResult.policies) {
      const policyIpfsCid = policy.policyIpfsCid;
      decodedPolicies[policyIpfsCid] = decodePolicyParametersFromChain(policy);
    }

    return {
      ...validationResult,
      appId: validationResult.appId.toNumber(),
      appVersion: validationResult.appVersion.toNumber(),
      decodedPolicies,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Validate Tool Execution And Get Policies: ${decodedError}`);
  }
}
