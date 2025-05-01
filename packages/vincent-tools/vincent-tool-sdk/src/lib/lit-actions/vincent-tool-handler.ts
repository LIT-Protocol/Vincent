import { TypeOf, z } from "zod";
import { ethers } from "ethers";

import { VincentPolicyDef, VincentToolDef } from "../types";

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

declare const toolParams: z.infer<VincentToolDef<any, any>['toolParamsSchema']>;

const LIT_DATIL_VINCENT_ADDRESS = '0x78Cd1d270Ff12BA55e98BDff1f3646426E25D932';
const LIT_DATIL_PUBKEY_ROUTER_ADDRESS = '0xF182d6bEf16Ba77e69372dD096D8B70Bc3d5B475';

export const vincentToolHandler = <
    ToolParams extends z.ZodType<any, any, any>,
    Policies extends Record<string, { policyDef: VincentPolicyDef; toolParameterMappings: Partial<{ [K in keyof TypeOf<ToolParams>]: string; }> }>,
>({ toolDef }: { toolDef: VincentToolDef<ToolParams, Policies> }) => {
    return async () => {
        try {
            const delegateeAddress = ethers.utils.getAddress(LitAuth.authSigAddress);
            const toolIpfsCid = LitAuth.actionIpfsIds[0];

            const parsedToolParams = toolDef.toolParamsSchema.parse(toolParams);

            const yellowstoneRpcProvider = new ethers.providers.JsonRpcProvider(
                await Lit.Actions.getRpcUrl({
                    chain: 'yellowstone',
                })
            );

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