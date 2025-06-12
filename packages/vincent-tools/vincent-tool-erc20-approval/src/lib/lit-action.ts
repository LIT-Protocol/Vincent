import { vincentToolHandler } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

// FIXME: This should be generated code

import { vincentTool } from './vincent-tool';
import { toolParamsSchema } from './schemas';

declare const toolParams: z.infer<typeof toolParamsSchema>;
declare const context: {
  delegatorPkpEthAddress: string;
};

(async () => {
  const func = vincentToolHandler({
    vincentTool: vincentTool,
    context: {
      toolIpfsCid: '',
      delegatorPkpEthAddress: context.delegatorPkpEthAddress,
    },
    toolParams,
  });
  await func();
})();
