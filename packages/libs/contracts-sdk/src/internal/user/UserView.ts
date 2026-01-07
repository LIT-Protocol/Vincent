import type { PermissionData, ValidateAbilityExecutionAndGetPoliciesResult } from '../../types';
import type { AbilityWithPolicies, AbilityExecutionValidation } from '../types/chain';
import type {
  GetAllRegisteredAgentAddressesOptions,
  GetPermittedAppVersionForAgentOptions,
  GetAllAbilitiesAndPoliciesForAppOptions,
  GetPermittedAppForAgentsOptions,
  ValidateAbilityExecutionAndGetPoliciesOptions,
  IsDelegateePermittedOptions,
  GetUnpermittedAppForAgentsOptions,
  GetUserAddressForAgentOptions,
} from './types.ts';

import { decodeContractError } from '../../utils';
import {
  decodePermissionDataFromChain,
  decodePolicyParametersForOneAbility,
} from '../../utils/policyParams';

export async function getAllRegisteredAgentAddresses(
  params: GetAllRegisteredAgentAddressesOptions,
): Promise<string[]> {
  const {
    contract,
    args: { userAddress, offset },
  } = params;

  try {
    const agentAddresses: string[] = await contract.getAllRegisteredAgentAddressesForUser(
      userAddress,
      offset,
    );

    return agentAddresses;
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);

    if (decodedError.includes('NoRegisteredAgentsFound')) {
      return [];
    }

    throw new Error(`Failed to Get All Registered Agent Addresses: ${decodedError}`);
  }
}

export async function getUserAddressForAgent(
  params: GetUserAddressForAgentOptions,
): Promise<string | null> {
  const {
    contract,
    args: { agentAddress },
  } = params;

  try {
    const userAddress: string = await contract.getUserAddressForAgent(agentAddress);

    return userAddress;
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);

    if (decodedError.includes('AgentNotRegistered')) {
      return null;
    }

    throw new Error(`Failed to Get User Address For Agent: ${decodedError}`);
  }
}

export async function getPermittedAppVersionForAgent(
  params: GetPermittedAppVersionForAgentOptions,
): Promise<number | null> {
  const {
    contract,
    args: { agentAddress, appId },
  } = params;

  try {
    const result = await contract.getPermittedAppForAgents([agentAddress]);

    if (!result || !result.length || result[0].permittedApp.appId === 0) {
      return null;
    }

    // Check if the permitted app matches the requested appId
    if (result[0].permittedApp.appId !== appId) {
      return null;
    }

    return result[0].permittedApp.version;
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get Permitted App Version For Agent: ${decodedError}`);
  }
}

export async function getPermittedAppForAgents(params: GetPermittedAppForAgentsOptions) {
  const {
    contract,
    args: { agentAddresses },
  } = params;

  try {
    const results = await contract.getPermittedAppForAgents(agentAddresses);

    return results.map((result: any) => ({
      agentAddress: result.agentAddress,
      permittedApp: {
        appId: result.permittedApp.appId,
        version: result.permittedApp.version,
        pkpSigner: result.permittedApp.pkpSigner,
        pkpSignerPubKey: result.permittedApp.pkpSignerPubKey,
        versionEnabled: result.permittedApp.versionEnabled,
        isDeleted: result.permittedApp.isDeleted,
      },
    }));
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get Permitted App For Agents: ${decodedError}`);
  }
}

export async function getAllAbilitiesAndPoliciesForApp(
  params: GetAllAbilitiesAndPoliciesForAppOptions,
): Promise<PermissionData> {
  const {
    contract,
    args: { agentAddress, appId },
  } = params;

  try {
    const abilities: AbilityWithPolicies[] = await contract.getAllAbilitiesAndPoliciesForApp(
      agentAddress,
      appId,
    );

    return decodePermissionDataFromChain(abilities);
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get All Abilities And Policies For App: ${decodedError}`);
  }
}

export async function validateAbilityExecutionAndGetPolicies(
  params: ValidateAbilityExecutionAndGetPoliciesOptions,
): Promise<ValidateAbilityExecutionAndGetPoliciesResult> {
  const {
    contract,
    args: { delegateeAddress, agentAddress, abilityIpfsCid },
  } = params;

  try {
    const validationResult: AbilityExecutionValidation =
      await contract.validateAbilityExecutionAndGetPolicies(
        delegateeAddress,
        agentAddress,
        abilityIpfsCid,
      );

    const { policies } = validationResult;
    const decodedPolicies = decodePolicyParametersForOneAbility({ policies });

    return {
      ...validationResult,
      appId: validationResult.appId,
      appVersion: validationResult.appVersion,
      decodedPolicies,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Validate Ability Execution And Get Policies: ${decodedError}`);
  }
}

export async function getUnpermittedAppForAgents(params: GetUnpermittedAppForAgentsOptions) {
  const {
    contract,
    args: { agentAddresses },
  } = params;

  try {
    const results = await contract.getUnpermittedAppForAgents(agentAddresses);

    return results.map((result: any) => ({
      agentAddress: result.agentAddress,
      unpermittedApp: {
        appId: result.unpermittedApp.appId,
        previousPermittedVersion: result.unpermittedApp.previousPermittedVersion,
        pkpSigner: result.unpermittedApp.pkpSigner,
        pkpSignerPubKey: result.unpermittedApp.pkpSignerPubKey,
        versionEnabled: result.unpermittedApp.versionEnabled,
        isDeleted: result.unpermittedApp.isDeleted,
      },
    }));
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get Unpermitted Apps For Agents: ${decodedError}`);
  }
}

export async function isDelegateePermitted(params: IsDelegateePermittedOptions): Promise<boolean> {
  const {
    contract,
    args: { delegateeAddress, agentAddress, abilityIpfsCid },
  } = params;

  try {
    const validationResult: AbilityExecutionValidation =
      await contract.validateAbilityExecutionAndGetPolicies(
        delegateeAddress,
        agentAddress,
        abilityIpfsCid,
      );

    return validationResult.isPermitted;
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Check If Delegatee Is Permitted: ${decodedError}`);
  }
}
