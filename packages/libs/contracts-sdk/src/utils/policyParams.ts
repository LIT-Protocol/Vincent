import { decode, encode } from 'cbor2';
import { arrayify, hexlify } from 'ethers/lib/utils';

import type {
  AbilityWithPolicies,
  PermissionDataOnChain,
  PolicyWithParameters,
} from '../internal/types/chain';
import type { AbilityPolicyParameterData, PermissionData, DeletePermissionData } from '../types';

/**
 * Converts a policy parameters object to the flattened array format required by the contract
 *
 * - If deletePermissionData contains an ability key that also exists in permissionData, an error is thrown.
 * - For abilities present only in deletePermissionData, the encoder will include those policy CIDs with a
 *   parameter value of '0x' to signal deletion on-chain.
 *
 * @param permissionData { PermissionData } - Object containing the nested policy parameters
 * @param deletePermissionData { DeletePermissionData } - Map of ability -> policy CIDs to delete
 * @returns The flattened array structure with abilityIpfsCids, policyIpfsCids, and policyParameterValues
 */
export function encodePermissionDataForChain(
  permissionData?: PermissionData,
  deletePermissionData?: DeletePermissionData,
): PermissionDataOnChain {
  const abilityIpfsCids: string[] = [];
  const policyIpfsCids: string[][] = [];
  const policyParameterValues: string[][] = [];

  // Validate: if any ability key exists both in permissionData and deletePermissionData, throw
  const safePermissionData = permissionData ?? {};
  if (deletePermissionData) {
    for (const abilityIpfsCid of Object.keys(deletePermissionData)) {
      if (safePermissionData[abilityIpfsCid]) {
        throw new Error(
          `deletePermissionData contains ability ${abilityIpfsCid} which also exists in permissionData. Please separate updates and deletes by ability.`,
        );
      }
    }
  }

  const abilityKeys = [
    ...Object.keys(safePermissionData),
    ...(deletePermissionData ? Object.keys(deletePermissionData) : []),
  ];

  abilityKeys.forEach((abilityIpfsCid) => {
    // Each ability needs matching-length arrays of policy IPFS CIDs and their parameter values
    abilityIpfsCids.push(abilityIpfsCid);

    const abilityPolicies = safePermissionData[abilityIpfsCid];
    const policiesToDelete = deletePermissionData?.[abilityIpfsCid];

    const abilityPolicyIpfsCids: string[] = [];
    const abilityPolicyParameterValues: string[] = [];

    if (abilityPolicies) {
      // Iterate through each policy for this ability to set/update
      Object.keys(abilityPolicies).forEach((policyIpfsCid) => {
        abilityPolicyIpfsCids.push(policyIpfsCid);
        const policyParams = abilityPolicies[policyIpfsCid];
        const encodedParams = encode(policyParams, { collapseBigInts: false });

        // Convert the encoded bytes to a hex string for the contract
        abilityPolicyParameterValues.push(hexlify(encodedParams));
      });
    } else if (policiesToDelete && policiesToDelete.length > 0) {
      // Deletion-only for this ability: supply CIDs and 0x as encoded params
      for (const policyIpfsCid of policiesToDelete) {
        abilityPolicyIpfsCids.push(policyIpfsCid);
        abilityPolicyParameterValues.push('0x');
      }
    }

    policyIpfsCids.push(abilityPolicyIpfsCids);
    policyParameterValues.push(abilityPolicyParameterValues);
  });

  return {
    abilityIpfsCids,
    policyIpfsCids,
    policyParameterValues,
  };
}

/**
 * Decodes policy parameters from a single policy's encoded parameters
 *
 * @param policy - PolicyWithParameters object containing policyIpfsCid and encoded policyParameterValues
 * @returns The decoded policy parameters object, or undefined if no parameters are provided
 */
export function decodePolicyParametersFromChain(
  policy: PolicyWithParameters,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): { [paramName: string]: any } | undefined {
  const encodedParams = policy.policyParameterValues;

  try {
    const byteArray = arrayify(encodedParams);
    return decode(byteArray) as { [paramName: string]: any };
  } catch (error: unknown) {
    console.error('Error decoding policy parameters:', error);
    throw error;
  }
}

/**
 * Converts AbilityWithPolicies[] from the contract to a PermissionData object
 *
 * @param abilitiesWithPolicies - Array of AbilityWithPolicies objects
 * @returns The nested policy parameters object. PolicyParameters have been decoded using `CBOR2`.
 */
export function decodePermissionDataFromChain(
  abilitiesWithPolicies: AbilityWithPolicies[],
): PermissionData {
  const permissionData: PermissionData = {};

  for (const ability of abilitiesWithPolicies) {
    const { abilityIpfsCid, policies } = ability;
    permissionData[abilityIpfsCid] = decodePolicyParametersForOneAbility({ policies });
  }

  return permissionData;
}

export function decodePolicyParametersForOneAbility({
  policies,
}: {
  policies: PolicyWithParameters[];
}) {
  const policyParamsDict: AbilityPolicyParameterData = {};

  for (const policy of policies) {
    const { policyIpfsCid, policyParameterValues } = policy;

    // Handle empty or invalid parameters - omit the policy from the returned object entirely; it was not enabled by the user
    if (!policyParameterValues || policyParameterValues === '0x') {
      continue;
    }

    // Otherwise, assume there are parameters (even if they might be `undefined` CBOR2) set by the user
    policyParamsDict[policyIpfsCid] = decodePolicyParametersFromChain(policy);
  }

  return policyParamsDict;
}
