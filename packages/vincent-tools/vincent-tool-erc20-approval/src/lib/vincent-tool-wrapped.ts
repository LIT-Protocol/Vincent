import { vincentToolHandler } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

import { Erc20ApprovalToolDef, Erc20ApprovalToolParamsSchema } from './vincent-tool';

declare const toolParams: z.infer<typeof Erc20ApprovalToolParamsSchema>;
declare const LitAuth: {
  authSigAddress: string;
};

(async () => {
  const func = vincentToolHandler({
    vincentTool: Erc20ApprovalToolDef,
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
