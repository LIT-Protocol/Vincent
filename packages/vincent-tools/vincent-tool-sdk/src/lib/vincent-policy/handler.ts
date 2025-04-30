import { z } from "zod"
import { ethers } from "ethers"

import { VincentPolicyDef } from "../types"
import { decodePolicyParams, getUserToolPolicies } from "../lit-action-utils"

declare const Lit: {
    Actions: {
        getRpcUrl: (args: { chain: string }) => Promise<string>;
        setResponse: (response: { response: string }) => void;
    }
}
declare const toolParams: z.infer<VincentPolicyDef['toolParamsSchema']>

export interface PolicyParameter {
    name: string;
    paramType: number;
    value: string;
}

export interface Policy {
    policyIpfsCid: string;
    parameters: PolicyParameter[];
}

export interface OnChainUserPolicyParams {
    isPermitted: boolean;
    appId: ethers.BigNumber;
    appVersion: ethers.BigNumber;
    policies: Policy[];
}

export const vincentPolicyHandler = ({ policyDef }: { policyDef: VincentPolicyDef }): (() => Promise<void>) => {
    return async (): Promise<void> => {
        try {
            const parsedToolParams = policyDef.toolParamsSchema.parse(toolParams);

            const yellowstoneRpcProvider = new ethers.providers.JsonRpcProvider(
                await Lit.Actions.getRpcUrl({
                    chain: 'yellowstone',
                })
            );

            const allOnChainUserPolicyParams: OnChainUserPolicyParams = await getUserToolPolicies(
                yellowstoneRpcProvider,
                parsedToolParams.delegateeAddress,
                parsedToolParams.userPkpTokenId,
                parsedToolParams.toolIpfsCid
            );

            if (!allOnChainUserPolicyParams.isPermitted) {
                throw new Error(`Delegatee: ${parsedToolParams.delegateeAddress} is not permitted to execute tool: ${parsedToolParams.toolIpfsCid} for App ID: ${allOnChainUserPolicyParams.appId.toString()} App Version: ${allOnChainUserPolicyParams.appVersion.toString()}`);
            }

            const onChainPolicyParams = allOnChainUserPolicyParams.policies.find(
                (policy) => policy.policyIpfsCid === policyDef.ipfsCid
            )?.parameters;

            let userParams: z.infer<VincentPolicyDef['userParamsSchema']>;
            if (!onChainPolicyParams) {
                userParams = policyDef.userParamsSchema.parse({});
            } else {
                const decodedPolicyParams = decodePolicyParams({ params: onChainPolicyParams });
                userParams = policyDef.userParamsSchema.parse(decodedPolicyParams);
            }

            const evaluateResult = await policyDef.evaluate({ toolParams: parsedToolParams, userParams });

            Lit.Actions.setResponse({
                response: JSON.stringify({
                    ...evaluateResult,
                    ipfsCid: policyDef.ipfsCid,
                })
            });
        } catch (error) {
            Lit.Actions.setResponse({
                response: JSON.stringify({
                    allow: false,
                    ipfsCid: policyDef.ipfsCid,
                    error: error instanceof Error ? error.message : String(error),
                })
            });
        }
    }
}