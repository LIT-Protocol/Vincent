import { vincentToolHandler } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

import { UniswapSwapToolDef, UniswapSwapToolParamsSchema } from './vincent-tool';

declare const userPkpTokenId: string;
declare const toolParams: z.infer<typeof UniswapSwapToolParamsSchema>;
declare const LitAuth: {
  authSigAddress: string;
};

(async () =>
  vincentToolHandler({
    vincentTool: UniswapSwapToolDef,
    baseContext: {
      delegation: {
        delegator: userPkpTokenId,
        delegatee: LitAuth.authSigAddress,
      },
    },
    toolParams,
  }))();
