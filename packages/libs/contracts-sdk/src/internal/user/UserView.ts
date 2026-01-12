import type {
  AgentPermittedApp,
  AgentUnpermittedApp,
  PermissionData,
  ValidateAbilityExecutionAndGetPoliciesResult,
} from '../../types';
import type { AbilityExecutionValidation, AbilityWithPolicies } from '../types/chain';
import type {
  ContractAgentPermittedApp,
  ContractAgentUnpermittedApp,
  GetAllAbilitiesAndPoliciesForAppOptions,
  GetAllRegisteredAgentAddressesForUserOptions,
  GetPermittedAppForAgentsOptions,
  GetUnpermittedAppForAgentsOptions,
  GetUserAddressForAgentOptions,
  IsDelegateePermittedOptions,
  ValidateAbilityExecutionAndGetPoliciesOptions,
} from './types.ts';

import { decodeContractError } from '../../utils';
import {
  decodePermissionDataFromChain,
  decodePolicyParametersForOneAbility,
} from '../../utils/policyParams';

export async function getAllRegisteredAgentAddressesForUser(
  params: GetAllRegisteredAgentAddressesForUserOptions,
): Promise<string[]> {
  const {
    contract,
    args: { userAddress, offset },
  } = params;

  try {
    return await contract.getAllRegisteredAgentAddressesForUser(userAddress, offset);
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
    return await contract.getUserAddressForAgent(agentAddress);
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);

    if (decodedError.includes('AgentNotRegistered')) {
      return null;
    }

    throw new Error(`Failed to Get User Address For Agent: ${decodedError}`);
  }
}

export async function getPermittedAppForAgents(
  params: GetPermittedAppForAgentsOptions,
): Promise<AgentPermittedApp[]> {
  const {
    contract,
    args: { agentAddresses },
  } = params;

  try {
    const results: ContractAgentPermittedApp[] =
      await contract.getPermittedAppForAgents(agentAddresses);

    return results.map((result) => {
      const appId = Number(result.permittedApp.appId);
      const permittedApp =
        appId === 0
          ? null
          : {
              appId,
              version: Number(result.permittedApp.version),
              pkpSigner: result.permittedApp.pkpSigner,
              pkpSignerPubKey: result.permittedApp.pkpSignerPubKey,
              versionEnabled: result.permittedApp.versionEnabled,
              isDeleted: result.permittedApp.isDeleted,
            };

      return {
        agentAddress: result.agentAddress,
        permittedApp,
      };
    });
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get Permitted App For Agents: ${decodedError}`);
  }
}

export async function getUnpermittedAppForAgents(
  params: GetUnpermittedAppForAgentsOptions,
): Promise<AgentUnpermittedApp[]> {
  const {
    contract,
    args: { agentAddresses },
  } = params;

  try {
    const results: ContractAgentUnpermittedApp[] =
      await contract.getUnpermittedAppForAgents(agentAddresses);

    return results.map((result) => {
      const appId = Number(result.unpermittedApp.appId);
      const unpermittedApp =
        appId === 0
          ? null
          : {
              appId,
              previousPermittedVersion: Number(result.unpermittedApp.previousPermittedVersion),
              pkpSigner: result.unpermittedApp.pkpSigner,
              pkpSignerPubKey: result.unpermittedApp.pkpSignerPubKey,
              versionEnabled: result.unpermittedApp.versionEnabled,
              isDeleted: result.unpermittedApp.isDeleted,
            };

      return {
        agentAddress: result.agentAddress,
        unpermittedApp,
      };
    });
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get Unpermitted App For Agents: ${decodedError}`);
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
