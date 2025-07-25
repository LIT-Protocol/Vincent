import type { BigNumber } from 'ethers';

import type {
  PermissionData,
  ToolPolicyParameterData,
  ValidateToolExecutionAndGetPoliciesResult,
} from '../../types';
import type { ToolWithPolicies, ToolExecutionValidation } from '../types/chain';
import type {
  GetAllRegisteredAgentPkpsOptions,
  GetPermittedAppVersionForPkpOptions,
  GetAllPermittedAppIdsForPkpOptions,
  GetAllToolsAndPoliciesForAppOptions,
  ValidateToolExecutionAndGetPoliciesOptions,
} from './types.ts';

import { decodeContractError } from '../../utils';
import { getPkpEthAddress, getPkpTokenId } from '../../utils/pkpInfo';
import {
  decodePermissionDataFromChain,
  decodePolicyParametersFromChain,
} from '../../utils/policyParams';

export async function getAllRegisteredAgentPkpEthAddresses(
  params: GetAllRegisteredAgentPkpsOptions,
): Promise<string[]> {
  const {
    contract,
    args: { userPkpAddress },
  } = params;

  try {
    const pkpTokenIds: BigNumber[] = await contract.getAllRegisteredAgentPkps(userPkpAddress);

    const pkpEthAdddresses: string[] = [];
    for (const tokenId of pkpTokenIds) {
      const pkpEthAddress = await getPkpEthAddress({ signer: contract.signer, tokenId });
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

export async function getPermittedAppVersionForPkp(
  params: GetPermittedAppVersionForPkpOptions,
): Promise<number | null> {
  const {
    contract,
    args: { pkpEthAddress, appId },
  } = params;

  try {
    const pkpTokenId = await getPkpTokenId({ pkpEthAddress, signer: contract.signer });

    const appVersion: BigNumber = await contract.getPermittedAppVersionForPkp(pkpTokenId, appId);

    if (!appVersion) return null;

    return appVersion.toNumber();
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get Permitted App Version For PKP: ${decodedError}`);
  }
}

export async function getAllPermittedAppIdsForPkp(
  params: GetAllPermittedAppIdsForPkpOptions,
): Promise<number[]> {
  const {
    contract,
    args: { pkpEthAddress },
  } = params;

  try {
    const pkpTokenId = await getPkpTokenId({ pkpEthAddress, signer: contract.signer });

    const appIds: BigNumber[] = await contract.getAllPermittedAppIdsForPkp(pkpTokenId);

    return appIds.map((appId) => appId.toNumber());
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get All Permitted App IDs For PKP: ${decodedError}`);
  }
}

export async function getAllToolsAndPoliciesForApp(
  params: GetAllToolsAndPoliciesForAppOptions,
): Promise<PermissionData> {
  const {
    contract,
    args: { pkpEthAddress, appId },
  } = params;

  try {
    const pkpTokenId = await getPkpTokenId({ pkpEthAddress, signer: contract.signer });

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

export async function validateToolExecutionAndGetPolicies(
  params: ValidateToolExecutionAndGetPoliciesOptions,
): Promise<ValidateToolExecutionAndGetPoliciesResult> {
  const {
    contract,
    args: { delegateeAddress, pkpEthAddress, toolIpfsCid },
  } = params;

  try {
    const pkpTokenId = await getPkpTokenId({ pkpEthAddress, signer: contract.signer });

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
