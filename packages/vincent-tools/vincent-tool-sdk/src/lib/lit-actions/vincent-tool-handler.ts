import { z } from "zod";
import { ethers } from "ethers";

import { VincentPolicyDef, VincentToolDef } from "../types";
import { getPkpInfo, NETWORK_CONFIG } from "../lit-action-utils";

declare const LitAuth: {
    authSigAddress: string;
    actionIpfsIds: string[];
}
declare const Lit: {
    Actions: {
        setResponse: (response: { response: string }) => void;
        call: (params: { ipfsId: string, params: Record<string, unknown> }) => Promise<string>;
        getRpcUrl: (args: { chain: string }) => Promise<string>;
    }
}

declare const toolParams: Record<string, unknown>;

export const vincentToolHandler = <
    ToolParams extends z.ZodType<any, any, any>,
    Policies extends Record<string, { policyDef: VincentPolicyDef; toolParameterMappings: any }>,
>(toolDef: VincentToolDef<ToolParams, Policies>) => {
    return async () => {
        try {
            console.log(`Using Lit Network: ${LIT_NETWORK}`);

            const networkConfig = NETWORK_CONFIG[LIT_NETWORK as keyof typeof NETWORK_CONFIG];
            console.log(
                `Using Vincent Contract Address: ${networkConfig.vincentAddress}`
            );
            console.log(
                `Using Pubkey Router Address: ${networkConfig.pubkeyRouterAddress}`
            );

            const delegateeAddress = ethers.utils.getAddress(LitAuth.authSigAddress);
            const toolIpfsCid = LitAuth.actionIpfsIds[0];
            console.log(`Tool: ${toolIpfsCid} being executed by delegatee: ${delegateeAddress}`);

            const yellowstoneRpcProvider = new ethers.providers.JsonRpcProvider(
                await Lit.Actions.getRpcUrl({
                    chain: 'yellowstone',
                })
            );

            const parsedToolParams = toolDef.toolParamsSchema.parse(toolParams);

            const pkpInfo = await getPkpInfo(networkConfig.pubkeyRouterAddress, yellowstoneRpcProvider, parsedToolParams.pkpEthAddress);
            console.log(`Retrieved PKP info for PKP ETH Address: ${toolParams.pkpEthAddress}: ${JSON.stringify(pkpInfo)}`);

            const supportedPolicies = Object.keys(toolDef.supportedPolicies) as Array<keyof Policies>;
            for (const policyIpfsCid of supportedPolicies) {
                const { policyDef, toolParameterMappings } = toolDef.supportedPolicies[policyIpfsCid];

                // Build mapped toolParams for the policy
                const mappedToolParams: Record<string, unknown> = {};
                for (const [toolParamKey, policyParamKey] of Object.entries(toolParameterMappings)) {
                    if (!policyParamKey) {
                        throw new Error(`Missing policy param key for tool param "${toolParamKey}"`);
                    }

                    if (!(toolParamKey in toolParams)) {
                        throw new Error(
                            `Tool param "${toolParamKey}" expected in toolParams but was not provided`
                        );
                    }

                    mappedToolParams[policyParamKey as string] =
                        toolParams[toolParamKey as keyof typeof toolParams];
                }

                try {
                    const rawResponse = await Lit.Actions.call({
                        ipfsId: policyDef.ipfsCid,
                        params: {
                            toolParams: {
                                ...mappedToolParams,
                                delegateeAddress,
                                toolIpfsCid,
                                userPkpTokenId: pkpInfo.tokenId,
                            }
                        },
                    });
                    const parsedResult = JSON.parse(rawResponse);
                } catch (err) {

                }
            }
        } catch (error) {
            // TODO
            Lit.Actions.setResponse({
                response: JSON.stringify({
                    policyEvaluationResults: {
                        allow: false,
                        evaluatedPolicies: [],
                        allowPolicyResults: {},
                        denyPolicyResult: {
                            policyKey: "unknown",
                            evalResult: {
                                allow: false,
                                ipfsCid: "unknown",
                                error: error instanceof Error ? error.message : String(error),
                            },
                        },
                    },
                    toolExecutionResult: {
                        success: false,
                        error: error instanceof Error ? error.message : String(error),
                    },
                }),
            });
        }
    }
}