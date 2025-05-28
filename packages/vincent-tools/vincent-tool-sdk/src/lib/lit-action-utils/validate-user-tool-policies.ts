import { type ethers } from 'ethers';

import { getUserToolPolicies, VincentToolPolicyResponse, type VincentToolResponse } from '.';

export const validateUserToolPolicies = async (
    yellowstoneProvider: ethers.providers.JsonRpcProvider,
    userRpcUrl: string,
    delegateeAddress: string,
    userPkpInfo: { tokenId: string, ethAddress: string, publicKey: string },
    toolIpfsCid: string,
    toolParams: Record<string, unknown>,
): Promise<VincentToolResponse> => {
    const { isPermitted, appId, appVersion, policies } = await getUserToolPolicies(yellowstoneProvider, delegateeAddress, userPkpInfo.tokenId, toolIpfsCid);

    console.log(`Retrieved Tool Policies for App ID: ${appId} App Version: ${appVersion} Delegatee: ${delegateeAddress} PKP: ${userPkpInfo.tokenId} from Vincent contract: ${JSON.stringify({ isPermitted, appId, appVersion, policies })}`);

    if (!isPermitted) {
        return {
            status: 'error',
            details: [
                `Delegatee: ${delegateeAddress} is not permitted to execute App ID: ${appId} App Version: ${appVersion} for PKP: ${userPkpInfo.tokenId}`,
            ]
        }
    }

    if (policies.length === 0) {
        console.log(
            `No policies found for App ID: ${appId} App Version: ${appVersion} tool ${toolIpfsCid} on PKP ${userPkpInfo.tokenId} for delegatee ${delegateeAddress}, skipping policy execution`
        );
        return {
            status: 'success',
            details: [
                `No policies found for App ID: ${appId} App Version: ${appVersion} tool ${toolIpfsCid} on PKP ${userPkpInfo.tokenId} for delegatee ${delegateeAddress}, skipping policy execution`
            ]
        }
    }

    const responseDetails = [];
    for (const policy of policies) {
        console.log(`Executing Policy child Lit Action: ${policy.policyIpfsCid} with parameters: ${JSON.stringify(policy.parameters, null, 2)}`);
        responseDetails.push(`Executing Policy child Lit Action: ${policy.policyIpfsCid} with parameters: ${JSON.stringify(policy.parameters, null, 2)}`);

        try {
            const response = await Lit.Actions.call({
                ipfsId: policy.policyIpfsCid,
                params: {
                    parentToolIpfsCid: toolIpfsCid,
                    userRpcUrl,
                    vincentAppId: appId.toString(),
                    vincentAppVersion: appVersion.toString(),
                    userPkpInfo,
                    toolParams,
                    policy,
                },
            });

            console.log(`Policy ${policy.policyIpfsCid} executed successfully with response: ${response}`);

            const parsedResponse = JSON.parse(response as unknown as string) as VincentToolPolicyResponse;

            if (!parsedResponse.allow) {
                return {
                    status: 'error',
                    details: parsedResponse.details
                }
            }

            responseDetails.push(`Policy ${policy.policyIpfsCid} executed successfully with response: ${response}`);
        } catch (error) {
            console.error(`Error executing policy: ${policy.policyIpfsCid} with parameters: ${JSON.stringify(policy.parameters)}`, error);

            return {
                status: 'error',
                details: [
                    ...responseDetails,
                    (error as Error).message || JSON.stringify(error)
                ]
            }
        }
    }

    console.log(`All policies executed successfully for App ID: ${appId} App Version: ${appVersion} tool ${toolIpfsCid} on PKP ${userPkpInfo.tokenId} for delegatee ${delegateeAddress}`);
    responseDetails.push(`All policies executed successfully for App ID: ${appId} App Version: ${appVersion} tool ${toolIpfsCid} on PKP ${userPkpInfo.tokenId} for delegatee ${delegateeAddress}`);

    return {
        status: 'success',
        details: responseDetails
    }
};