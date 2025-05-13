import { z } from 'zod';

import { spendingLimitPolicyToolParamsSchema } from './vincent-policy';


export const spendingLimitPolicyPrecheck = async (
    { toolParams }: { toolParams: z.infer<typeof spendingLimitPolicyToolParamsSchema> }
) => {
    // const { pkpEthAddress, rpcUrl, chainId, tokenInAddress, tokenOutAddress, tokenInAmount, tokenInDecimals, tokenOutDecimals } = toolParams;

    console.log('spendingLimitPolicyPrecheck');
}