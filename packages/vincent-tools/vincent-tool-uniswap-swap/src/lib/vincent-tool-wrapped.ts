import { vincentToolHandler } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

import { UniswapSwapToolDef, UniswapSwapToolParamsSchema } from './vincent-tool';

declare const userPkpTokenId: string;
declare const toolParams: z.infer<typeof UniswapSwapToolParamsSchema>;

(async () =>
  vincentToolHandler({
    vincentToolDef: UniswapSwapToolDef,
    context: {
      pkpTokenId: userPkpTokenId,
      delegation: {
        delegatee: userPkpTokenId,
        delegator: userPkpTokenId,
      },
    },
    toolParams,
  }))();
