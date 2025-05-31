import { vincentToolHandler } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

import { UniswapSwapToolDef, UniswapSwapToolParamsSchema } from './vincent-tool';

declare const toolParams: z.infer<typeof UniswapSwapToolParamsSchema>;
declare const LitAuth: {
  authSigAddress: string;
};

// (() => (vincentToolHandler({
//   vincentTool: UniswapSwapToolDef,
//   baseContext: {
//     delegation: {
//       delegator: toolParams.pkpEthAddress,
//       delegatee: LitAuth.authSigAddress,
//     },
//   },
//   toolParams,
// }))())();

(async () => {
  const func = vincentToolHandler({
    vincentTool: UniswapSwapToolDef,
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
