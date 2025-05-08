import { TypeOf, z } from "zod";
import { ethers } from "ethers";

import type { VincentPolicy, VincentPolicyEvaluationResults, VincentToolDef, WrappedCommitFunction, OnlyAllowedPolicyEvaluationResults } from "../types";
import type { BaseContext } from "../vincentPolicy";
import { formatZodErrorString, getAllUserPoliciesRegisteredForTool, getPkpInfo } from "./utils";
import { LIT_DATIL_PUBKEY_ROUTER_ADDRESS, LIT_DATIL_VINCENT_ADDRESS } from "./constants";

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

export const vincentToolHandler = <
    ToolParams extends z.ZodType<any, any, any>,
    Policies extends Record<string, { policyDef: VincentPolicy; toolParameterMappings: Partial<{ [K in keyof TypeOf<ToolParams>]: string; }> }>,
>({ vincentToolDef, context }: { vincentToolDef: VincentToolDef<ToolParams, Policies>, context: BaseContext }) => {
    return async () => {
        try {
            const toolIpfsCid = LitAuth.actionIpfsIds[0];
            const parsedToolParams = parseToolParams({ toolParams, toolParamsSchema: vincentToolDef.toolParamsSchema });

            const pkpInfo = await getPkpInfo({
                litPubkeyRouterAddress: LIT_DATIL_PUBKEY_ROUTER_ADDRESS,
                yellowstoneRpcUrl: await Lit.Actions.getRpcUrl({ chain: 'yellowstone' }),
                pkpEthAddress: parsedToolParams.pkpEthAddress
            });

            const { registeredUserPolicyIpfsCids, appId, appVersion } = await getAllUserPoliciesRegisteredForTool({
                yellowstoneRpcUrl: await Lit.Actions.getRpcUrl({ chain: 'yellowstone' }),
                vincentContractAddress: LIT_DATIL_VINCENT_ADDRESS,
                appDelegateeAddress: ethers.utils.getAddress(LitAuth.authSigAddress),
                agentWalletPkpTokenId: parsedToolParams.userPkpTokenId,
                toolIpfsCid,
            });

            const evaluatedPolicies: Array<keyof Policies> = [];
            const allowPolicyResults: VincentPolicyEvaluationResults<Policies>["allowPolicyResults"] = {};
            let denyPolicyResult: VincentPolicyEvaluationResults<Policies>["denyPolicyResult"] = undefined;

            // Create a reverse mapping of Policy IPFS CIDs to Policy package names
            // to avoid having to loop over toolDef.supportedPolicies for each
            // registered on-chain policy
            const policyIpfsCidToPackageName = Object.entries(vincentToolDef.supportedPolicies).reduce(
                (acc, [key, policy]) => {
                    acc[policy.policyDef.ipfsCid] = key as keyof Policies;
                    return acc;
                },
                {} as Record<string, keyof Policies>
            );

            // First we want to validate registeredUserPolicyIpfsCid is supported by this Tool,
            // then we want to validate we can map all the required policyParams to the provided parsedToolParams.
            // We do this before executing any policies to avoid having an error after some policies have already been executed.
            const validatedPolicies: Array<{ policyPackageName: keyof Policies; policyParams: Record<string, unknown> }> = [];

            for (const registeredUserPolicyIpfsCid of registeredUserPolicyIpfsCids) {
                const policyPackageName = policyIpfsCidToPackageName[registeredUserPolicyIpfsCid];

                if (!policyPackageName) {
                    throw new Error(`Policy with IPFS CID ${registeredUserPolicyIpfsCid} is registered on-chain but not supported by this tool. Vincent Tool: ${toolIpfsCid}, App ID: ${appId.toString()}, App Version: ${appVersion.toString()}, Agent Wallet PKP Token ID: ${pkpInfo.tokenId} (vincentToolHandler)`);
                }

                const policy = vincentToolDef.supportedPolicies[policyPackageName];
                const policyParams: Record<string, unknown> = {};

                for (const [toolParamKey, policyParamKey] of Object.entries(policy.toolParameterMappings)) {
                    if (!(toolParamKey in parsedToolParams)) {
                        throw new Error(`Tool param "${toolParamKey}" expected in toolParams but was not provided (vincentToolHandler)`);
                    }

                    // This shouldn't happen, if it does it means toolParameterMappings is malformed
                    if (!policyParamKey) {
                        throw new Error(`Policy "${policyPackageName as string}" is missing a corresponding policy parameter key for tool parameter: ${toolParamKey} (vincentToolHandler)`);
                    }

                    policyParams[policyParamKey] = parsedToolParams[toolParamKey];
                }

                validatedPolicies.push({ policyPackageName, policyParams });
            }

            for (const { policyPackageName, policyParams } of validatedPolicies) {
                const policy = vincentToolDef.supportedPolicies[policyPackageName];

                const rawLitActionResponse = await Lit.Actions.call({
                    ipfsId: policy.policyDef.ipfsCid,
                    params: {
                        toolParams: {
                            ...policyParams,
                            toolIpfsCid,
                            userPkpTokenId: pkpInfo.tokenId,
                        }
                    }
                });

                const parsedLitActionResponse = JSON.parse(rawLitActionResponse);

                evaluatedPolicies.push(policyPackageName);

                const policyExecutionResult = parsedLitActionResponse.allow
                    ? policy.policyDef.evalAllowResultSchema?.parse(parsedLitActionResponse) ?? parsedLitActionResponse
                    : policy.policyDef.evalDenyResultSchema?.parse(parsedLitActionResponse) ?? parsedLitActionResponse;

                if (parsedLitActionResponse.allow) {
                    // TODO
                    // @ts-expect-error Resolve TypeScript error for allowPolicyResults type mismatch
                    allowPolicyResults[policyPackageName as keyof Policies] = {
                        result: policyExecutionResult,
                        ...(typeof policy.policyDef === "object" && "commit" in policy.policyDef && typeof policy.policyDef.commit === "function"
                            ? { commit: policy.policyDef.commit.bind(policy.policyDef) }
                            : undefined),
                    };
                } else {
                    denyPolicyResult = { result: policyExecutionResult, ipfsCid: policy.policyDef.ipfsCid };
                    break;
                }
            }

            const policyEvaluationResults = denyPolicyResult
                ? {
                    allow: false,
                    evaluatedPolicies,
                    allowPolicyResults,
                    denyPolicyResult,
                } as VincentPolicyEvaluationResults<Policies>
                : {
                    allow: true,
                    evaluatedPolicies,
                    allowPolicyResults,
                } as OnlyAllowedPolicyEvaluationResults<Policies>;

            let toolExecutionResult;
            if (!policyEvaluationResults.allow) {
                toolExecutionResult = { success: false, reason: "A policy denied execution" };
            } else {
                toolExecutionResult = await vincentToolDef.execute(
                    parsedToolParams,
                    policyEvaluationResults as OnlyAllowedPolicyEvaluationResults<Policies>,
                    // TODO
                    // @ts-expect-error Argument of type 'BaseContext' is not assignable to parameter of type 'ToolContext<undefined, undefined, any>'.
                    context
                );

                for (const allowPolicyResult of Object.values(allowPolicyResults)) {
                    if (allowPolicyResult && allowPolicyResult.commit) {
                        // TODO The result of these commit functions should be returned
                        await (allowPolicyResult.commit as WrappedCommitFunction<any, any>)(allowPolicyResult.result);
                    }
                }
            }

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
