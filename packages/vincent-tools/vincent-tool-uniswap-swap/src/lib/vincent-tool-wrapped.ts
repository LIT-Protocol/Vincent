import { vincentToolHandler } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

import { VincentToolUniswapSwap, toolParamsSchema } from './vincent-tool';

declare const toolParams: z.infer<typeof toolParamsSchema>;
declare const LitAuth: {
  authSigAddress: string;
};

(async () => {
  const func = vincentToolHandler({
    vincentTool: VincentToolUniswapSwap,
    baseContext: {
      delegation: {
        delegator: toolParams.pkpEthAddress,
        delegatee: LitAuth.authSigAddress,
      },
    },
    toolParams,
  });
  await func();
})();
