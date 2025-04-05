import { getUserToolPolicies } from '@lit-protocol/vincent-tool';
import { ethers } from 'ethers';

export const validatePolicyIsPermitted = async (
    yellowstoneRpcProvider: ethers.providers.JsonRpcProvider,
    userPkpTokenId: string,
    parentToolIpfsCid: string,
) => {
    console.log(`Spending Limit Policy is being executed by parent Lit Action tool: ${parentToolIpfsCid}`);

    const delegateeAddress = ethers.utils.getAddress(LitAuth.authSigAddress);
    const { isPermitted, appId, appVersion, policies } = await getUserToolPolicies(yellowstoneRpcProvider, delegateeAddress, userPkpTokenId, parentToolIpfsCid);

    console.log(`Retrieved Tool Policies for App ID: ${appId} App Version: ${appVersion} Delegatee: ${delegateeAddress} PKP: ${userPkpTokenId} from Vincent contract: ${JSON.stringify({ isPermitted, appId, appVersion, policies })}`);

    if (!isPermitted) {
        throw new Error(`Delegatee: ${delegateeAddress} is not permitted to execute App ID: ${appId} App Version: ${appVersion} for PKP: ${userPkpTokenId}`);
    }

    if (policies.length === 0) {
        throw new Error(
            `No policies found for App ID: ${appId} App Version: ${appVersion} tool ${parentToolIpfsCid} on PKP ${userPkpTokenId} for delegatee ${delegateeAddress}`
        );
    }

    const policyIpfsCid = LitAuth.actionIpfsIds[0];
    if (!policies.find(policy => policy.policyIpfsCid.toLowerCase() === policyIpfsCid.toLowerCase())) {
        throw new Error(`Policy ${policyIpfsCid} not found for App ID: ${appId} App Version: ${appVersion} tool ${parentToolIpfsCid} on PKP ${userPkpTokenId} for delegatee ${delegateeAddress}`);
    } else {
        console.log(`Policy ${policyIpfsCid} found for App ID: ${appId} App Version: ${appVersion} tool ${parentToolIpfsCid} on PKP ${userPkpTokenId} for delegatee ${delegateeAddress}`);
    }
}