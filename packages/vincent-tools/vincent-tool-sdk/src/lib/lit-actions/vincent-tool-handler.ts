import { TypeOf, z } from "zod";

import { VincentPolicyDef, VincentPolicyEvaluationResults, VincentToolDef } from "../types";
import { formatZodErrorString } from "../format-zod-error-string";
import { getPkpInfo } from "../get-pkp-info";

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

const LIT_DATIL_PUBKEY_ROUTER_ADDRESS = '0xF182d6bEf16Ba77e69372dD096D8B70Bc3d5B475';

export const vincentToolHandler = <
    ToolParams extends z.ZodType<any, any, any>,
    Policies extends Record<string, { policyDef: VincentPolicyDef; toolParameterMappings: Partial<{ [K in keyof TypeOf<ToolParams>]: string; }> }>,
>({ toolDef }: { toolDef: VincentToolDef<ToolParams, Policies> }) => {
    return async () => {
        try {
            const toolIpfsCid = LitAuth.actionIpfsIds[0];
            const parsedToolParams = parseToolParams({ toolParams, toolParamsSchema: toolDef.toolParamsSchema });

            const pkpInfo = await getPkpInfo({
                litPubkeyRouterAddress: LIT_DATIL_PUBKEY_ROUTER_ADDRESS,
                yellowstoneRpcUrl: await Lit.Actions.getRpcUrl({ chain: 'yellowstone' }),
                pkpEthAddress: parsedToolParams.pkpEthAddress
            });

            const evaluatedPolicies: Array<keyof Policies> = [];
            const allowPolicyResults: VincentPolicyEvaluationResults<Policies>["allowPolicyResults"] = {};
            let denyPolicyResult: VincentPolicyEvaluationResults<Policies>["denyPolicyResult"] = undefined;

            for (const [policyName, policy] of Object.entries(toolDef.supportedPolicies)) {
                const mappedPolicyToolParams: Record<string, unknown> = {};

                for (const [toolParamKey, policyParamKey] of Object.entries(policy.toolParameterMappings)) {
                    if (!(toolParamKey in parsedToolParams)) {
                        throw new Error(`Tool param "${toolParamKey}" expected in toolParams but was not provided (vincentToolHandler)`);
                    }

                    if (!policyParamKey) {
                        throw new Error(`Missing policy param key for tool param "${toolParamKey}" (vincentToolHandler)`);
                    }

                    mappedPolicyToolParams[policyParamKey] = parsedToolParams[toolParamKey];
                }

                const rawLitActionResponse = await Lit.Actions.call({
                    ipfsId: policy.policyDef.ipfsCid,
                    params: {
                        toolParams: {
                            ...mappedPolicyToolParams,
                            toolIpfsCid,
                            userPkpTokenId: pkpInfo.tokenId,
                        }
                    }
                });
                const parsedLitActionResponse = JSON.parse(rawLitActionResponse);

                evaluatedPolicies.push(policyName);

                if (parsedLitActionResponse.allow) {
                    allowPolicyResults[policyName as keyof Policies] = {
                        result: parsedLitActionResponse,
                        ...(typeof policy.policyDef === "object" && "commit" in policy.policyDef
                            ? { commit: policy.policyDef.commit.bind(policy.policyDef) }
                            : {}),
                    } as VincentPolicyEvaluationResults<Policies>["allowPolicyResults"][keyof Policies];
                } else {
                    denyPolicyResult = {
                        result: parsedLitActionResponse,
                        ipfsCid: policy.policyDef.ipfsCid,
                    };
                    break;
                }
            }

            const policyEvaluationResults: VincentPolicyEvaluationResults<Policies> = denyPolicyResult
                ? {
                    allow: false,
                    evaluatedPolicies,
                    allowPolicyResults,
                    denyPolicyResult,
                }
                : {
                    allow: true,
                    evaluatedPolicies,
                    allowPolicyResults,
                };

            const toolExecutionResult = policyEvaluationResults.allow
                ? await toolDef.execute(parsedToolParams, policyEvaluationResults)
                : { success: false, reason: "Policy denied execution" };

            // TODO Policy commit executions

            Lit.Actions.setResponse({
                response: JSON.stringify({
                    policyEvaluationResults,
                    toolExecutionResult,
                }),
            });
        } catch (error) {
            Lit.Actions.setResponse({
                response: JSON.stringify({
                    toolExecutionResult: {
                        success: false,
                        error: error instanceof Error ? error.message : String(error),
                    },
                }),
            });
        }
    }
}

const parseToolParams = ({ toolParams, toolParamsSchema }: { toolParams: z.infer<VincentToolDef<any, any>['toolParamsSchema']>, toolParamsSchema: z.ZodType<any, any, any> }) => {
    try {
        return toolParamsSchema.parse(toolParams);
    } catch (error) {
        const errorMessage = error instanceof z.ZodError ? formatZodErrorString(error) : error instanceof Error ? error.message : String(error);
        throw new Error(`Error parsing toolParams using Zod toolParamsSchema (parseToolParams): ${errorMessage}`);
    }
}
