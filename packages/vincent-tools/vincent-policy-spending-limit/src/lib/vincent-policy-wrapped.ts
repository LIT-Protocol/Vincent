import { vincentPolicyHandler } from '@lit-protocol/vincent-tool-sdk';

import { SpendingLimitPolicyDef, SpendingLimitPolicyToolParamsSchema } from './vincent-policy';

const _litActionCode = async () => {
  await vincentPolicyHandler({
    vincentPolicyDef: SpendingLimitPolicyDef,
    context: {
      userPkpTokenId: '0x123',
      toolIpfsCid: '0x456',
      rpcUrl: 'https://mainnet.infura.io/v3/1234567890',
    },
    toolParams: SpendingLimitPolicyToolParamsSchema,
  });
};

export const litActionCode = `(${_litActionCode.toString()})();`;
