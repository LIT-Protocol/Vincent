import { vincentToolHandler } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

import { vincentTool } from './vincent-tool';
import { toolParams as toolParamsSchema } from '../../schemas/common';

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
