import { getUserToolPolicies, type VincentToolPolicyResponse } from '@lit-protocol/vincent-tool';
import { ethers } from 'ethers';

export const validatePolicyIsPermitted = async (
    yellowstoneRpcProvider: ethers.providers.JsonRpcProvider,
    userPkpTokenId: string,
    parentToolIpfsCid: string,
): Promise<VincentToolPolicyResponse> => {
    console.log(`Spending Limit Policy is being executed by parent Lit Action tool: ${parentToolIpfsCid}`);

    const delegateeAddress = ethers.utils.getAddress(LitAuth.authSigAddress);
    const { isPermitted, appId, appVersion, policies } = await getUserToolPolicies(yellowstoneRpcProvider, delegateeAddress, userPkpTokenId, parentToolIpfsCid);

    console.log(`Retrieved Tool Policies for App ID: ${appId} App Version: ${appVersion} Delegatee: ${delegateeAddress} PKP: ${userPkpTokenId} from Vincent contract: ${JSON.stringify({ isPermitted, appId, appVersion, policies })}`);

    if (!isPermitted) {
        return {
            allow: false,
            details: [
                `Delegatee: ${delegateeAddress} is not permitted to execute App ID: ${appId} App Version: ${appVersion} for PKP: ${userPkpTokenId}`
            ]
        }
    }

    if (policies.length === 0) {
        return {
            allow: false,
            details: [
                `No policies found for App ID: ${appId} App Version: ${appVersion} tool ${parentToolIpfsCid} on PKP ${userPkpTokenId} for delegatee ${delegateeAddress}`
            ]
        }
    }

    const policyIpfsCid = LitAuth.actionIpfsIds[0];
    if (!policies.find(policy => policy.policyIpfsCid.toLowerCase() === policyIpfsCid.toLowerCase())) {
        return {
            allow: false,
            details: [
                `Policy ${policyIpfsCid} not found for App ID: ${appId} App Version: ${appVersion} tool ${parentToolIpfsCid} on PKP ${userPkpTokenId} for delegatee ${delegateeAddress}`
            ]
        }
    }

    return {
        allow: true,
        details: [
            `Policy ${policyIpfsCid} found for App ID: ${appId} App Version: ${appVersion} tool ${parentToolIpfsCid} on PKP ${userPkpTokenId} for delegatee ${delegateeAddress}`
        ]
    }
}