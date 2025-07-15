import * as CBOR2 from 'cbor2';
import { arrayify } from 'ethers/lib/utils';

import type { PermissionData } from '../types/User';
import type { PermissionDataOnChain, ToolWithPolicies } from '../types/internal';

/**
 * Converts a policy parameters object to the flattened array format required by the contract
 *
 * @param permissionData { PermissionData } - Object containing the nested policy parameters
 * @returns The flattened array structure with toolIpfsCids, policyIpfsCids, and policyParameterValues
 */
export function encodePermissionDataForChain(
  permissionData: PermissionData,
): PermissionDataOnChain {
  const toolIpfsCids: string[] = [];
  const policyIpfsCids: string[][] = [];
  const policyParameterValues: string[][] = [];

  Object.keys(permissionData).forEach((toolIpfsCid) => {
    // Each tool needs matching-length arrays of policy IPFS CIDs and their parameter values
    // If the user hasn't enabled a policy, the tool object won't even have a property for that policy's CID

    // However, a policy may be enabled but have no parameters (headless policy)
    // In that case, we expect to encode `undefined` as the policy's value using CBOR2 (0xf7)

    toolIpfsCids.push(toolIpfsCid);

    const toolPolicies = permissionData[toolIpfsCid];
    const toolPolicyIpfsCids: string[] = [];
    const toolPolicyParameterValues: string[] = [];

    // Iterate through each policy for this tool
    Object.keys(toolPolicies).forEach((policyIpfsCid) => {
      toolPolicyIpfsCids.push(policyIpfsCid);

      // Encode the policy parameters using CBOR2
      const policyParams = toolPolicies[policyIpfsCid];
      const encodedParams = CBOR2.encode(policyParams);

      // Convert the encoded bytes to a hex string for the contract
      toolPolicyParameterValues.push('0x' + Buffer.from(encodedParams).toString('hex'));
    });

    policyIpfsCids.push(toolPolicyIpfsCids);
    policyParameterValues.push(toolPolicyParameterValues);
  });

  return {
    toolIpfsCids,
    policyIpfsCids,
    policyParameterValues,
  };
}

/**
 * Converts ToolWithPolicies[] from the contract to a PermissionData object
 *
 * @param toolsWithPolicies - Array of ToolWithPolicies objects
 * @returns The nested policy parameters object. PolicyParameters have been decoded using `CBOR2`.
 */

export function decodePermissionDataFromChain(
  toolsWithPolicies: ToolWithPolicies[],
): PermissionData {
  const permissionData: PermissionData = {};

  for (const tool of toolsWithPolicies) {
    const toolIpfsCid = tool.toolIpfsCid;
    permissionData[toolIpfsCid] = {};

    for (const policy of tool.policies) {
      const policyIpfsCid = policy.policyIpfsCid;
      const encodedParams = policy.policyParameterValues;

      if (encodedParams && encodedParams.length > 0) {
        // arrayify() has no Buffer dep, validates well-formed, and handles leading `0x`
        const byteArray = arrayify(encodedParams);
        permissionData[toolIpfsCid][policyIpfsCid] = CBOR2.decode(byteArray);
      }
    }
  }

  return permissionData;
}
