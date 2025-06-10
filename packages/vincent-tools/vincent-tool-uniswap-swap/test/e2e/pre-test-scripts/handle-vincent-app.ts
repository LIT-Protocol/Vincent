import { handleVincentApp, VINCENT_APP_PARAMETER_TYPE } from '@lit-protocol/vincent-tool-sdk';
import { VincentToolErc20ApprovalMetadata } from '@lit-protocol/vincent-tool-erc20-approval';
import { VincentPolicySpendingLimitMetadata } from '@lit-protocol/vincent-policy-spending-limit';

import { VincentToolUniswapSwapMetadata } from '../../../src';

export const vincentToolsForVincentApp = [
  {
    ipfsCid: VincentToolErc20ApprovalMetadata.ipfsCid,
    policies: [], // No policies for ERC20_APPROVAL_TOOL
  },
  {
    ipfsCid: VincentToolUniswapSwapMetadata.ipfsCid,
    policies: [
      {
        ipfsCid: VincentPolicySpendingLimitMetadata.ipfsCid,
        parameterNames: ['maxDailySpendingLimitInUsdCents'],
        parameterTypes: [VINCENT_APP_PARAMETER_TYPE.UINT256],
      },
    ],
  },
];

(() => handleVincentApp({ vincentTools: vincentToolsForVincentApp }))();
