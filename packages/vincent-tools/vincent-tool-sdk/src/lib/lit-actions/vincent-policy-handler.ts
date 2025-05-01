import { z } from "zod"
import { ethers } from "ethers"

import { VincentPolicyDef } from "../types"
import { getOnChainPolicyParams } from "../get-onchain-policy-params"
import { formatZodError } from "../format-zod-error"

declare const Lit: {
    Actions: {
        getRpcUrl: (args: { chain: string }) => Promise<string>;
        setResponse: (response: { response: string }) => void;
    }
}
declare const LitAuth: {
    authSigAddress: string;
}
declare const toolParams: z.infer<VincentPolicyDef['toolParamsSchema']>

const LIT_DATIL_VINCENT_ADDRESS = '0x78Cd1d270Ff12BA55e98BDff1f3646426E25D932';

export const vincentPolicyHandler = ({ policyDef }: { policyDef: VincentPolicyDef }): (() => Promise<void>) => {
    return async (): Promise<void> => {
        try {
            const parsedToolParams = parseToolParams(toolParams, policyDef.toolParamsSchema);

            const onChainPolicyParams = await getOnChainPolicyParams({
                yellowstoneRpcUrl: await Lit.Actions.getRpcUrl({
                    chain: 'yellowstone',
                }),
                vincentContractAddress: LIT_DATIL_VINCENT_ADDRESS,
                appDelegateeAddress: ethers.utils.getAddress(LitAuth.authSigAddress),
                agentWalletPkpTokenId: parsedToolParams.userPkpTokenId,
                toolIpfsCid: parsedToolParams.toolIpfsCid,
                policyIpfsCid: policyDef.ipfsCid,
                policyUserParamsSchema: policyDef.userParamsSchema,
            });

            const evaluateResult = await policyDef.evaluate({ toolParams: parsedToolParams, userParams: onChainPolicyParams });

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

const parseToolParams = (toolParams: z.infer<VincentPolicyDef['toolParamsSchema']>, toolParamsSchema: z.ZodType<any, any, any>) => {
    try {
        return toolParamsSchema.parse(toolParams);
    } catch (error) {
        const errorMessage = error instanceof z.ZodError ? formatZodError(error) : error instanceof Error ? error.message : String(error);
        throw new Error(`Error parsing toolParams using Zod toolParamsSchema (parseToolParams): ${errorMessage}`);
    }
}
