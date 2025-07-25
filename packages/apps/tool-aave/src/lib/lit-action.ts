import { vincentToolHandler } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

import { vincentTool } from './vincent-tool';
import { toolParamsSchema } from './schemas';

// FIXME: This should be generated code

declare const toolParams: z.infer<typeof toolParamsSchema>;
declare const context: {
  delegatorPkpEthAddress: string;
};

(async () => {
  const func = vincentToolHandler({
    vincentTool: vincentTool,
    context: {
      delegatorPkpEthAddress: context.delegatorPkpEthAddress,
    },
    toolParams,
  });
  await func();
})();
