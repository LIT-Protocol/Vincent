import { vincentToolHandler } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

import { VincentToolErc20Approval, toolParamsSchema } from './vincent-tool';

declare const toolParams: z.infer<typeof toolParamsSchema>;
declare const LitAuth: {
  authSigAddress: string;
};

(async () => {
  const func = vincentToolHandler({
    vincentTool: VincentToolErc20Approval,
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
