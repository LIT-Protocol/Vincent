import type { BigNumber } from 'ethers';

import type {
  PermissionData,
  ValidateAbilityExecutionAndGetPoliciesResult,
  PkpPermittedApps,
} from '../../types';
import type { AbilityWithPolicies, AbilityExecutionValidation } from '../types/chain';
import type {
  GetAllRegisteredAgentPkpsOptions,
  GetPermittedAppVersionForPkpOptions,
  GetAllPermittedAppIdsForPkpOptions,
  GetAllAbilitiesAndPoliciesForAppOptions,
  GetPermittedAppsForPkpsOptions,
  ValidateAbilityExecutionAndGetPoliciesOptions,
  ContractPkpPermittedApps,
} from './types.ts';

import { decodeContractError } from '../../utils';
import { getPkpEthAddress, getPkpTokenId } from '../../utils/pkpInfo';
import {
  decodePermissionDataFromChain,
  decodePolicyParametersForOneAbility,
} from '../../utils/policyParams';

export async function getAllRegisteredAgentPkpEthAddresses(
  params: GetAllRegisteredAgentPkpsOptions,
): Promise<string[]> {
  const {
    contract,
    args: { userPkpAddress, offset },
  } = params;

  try {
    const pkpTokenIds: BigNumber[] = await contract.getAllRegisteredAgentPkps(
      userPkpAddress,
      offset,
    );

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

    const appVersion: number = await contract.getPermittedAppVersionForPkp(pkpTokenId, appId);

    if (!appVersion) return null;

    return appVersion;
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
    args: { pkpEthAddress, offset },
  } = params;

  try {
    const pkpTokenId = await getPkpTokenId({ pkpEthAddress, signer: contract.signer });

    const appIds: number[] = await contract.getAllPermittedAppIdsForPkp(pkpTokenId, offset);

    return appIds.map((id: number) => id);
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get All Permitted App IDs For PKP: ${decodedError}`);
  }
}

export async function getPermittedAppsForPkps(
  params: GetPermittedAppsForPkpsOptions,
): Promise<PkpPermittedApps[]> {
  const {
    contract,
    args: { pkpEthAddresses, offset, pageSize },
  } = params;

  try {
    const pkpTokenIds: BigNumber[] = [];
    for (const pkpEthAddress of pkpEthAddresses) {
      const pkpTokenId = await getPkpTokenId({ pkpEthAddress, signer: contract.signer });
      pkpTokenIds.push(pkpTokenId);
    }

    const results: ContractPkpPermittedApps[] = await contract.getPermittedAppsForPkps(
      pkpTokenIds,
      offset,
      pageSize,
    );

    return results.map((result: ContractPkpPermittedApps) => ({
      pkpTokenId: result.pkpTokenId.toString(),
      permittedApps: result.permittedApps.map((app) => ({
        appId: app.appId,
        version: app.version,
        versionEnabled: app.versionEnabled,
      })),
    }));
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get Permitted Apps For PKPs: ${decodedError}`);
  }
}

export async function getAllAbilitiesAndPoliciesForApp(
  params: GetAllAbilitiesAndPoliciesForAppOptions,
): Promise<PermissionData> {
  const {
    contract,
    args: { pkpEthAddress, appId },
  } = params;

  try {
    const pkpTokenId = await getPkpTokenId({ pkpEthAddress, signer: contract.signer });

    const abilities: AbilityWithPolicies[] = await contract.getAllAbilitiesAndPoliciesForApp(
      pkpTokenId,
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
    args: { delegateeAddress, pkpEthAddress, abilityIpfsCid },
  } = params;

  try {
    const pkpTokenId = await getPkpTokenId({ pkpEthAddress, signer: contract.signer });

    const validationResult: AbilityExecutionValidation =
      await contract.validateAbilityExecutionAndGetPolicies(
        delegateeAddress,
        pkpTokenId,
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
