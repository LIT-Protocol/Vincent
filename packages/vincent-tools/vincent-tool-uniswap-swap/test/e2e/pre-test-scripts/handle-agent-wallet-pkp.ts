import { handleAgentWalletPkp } from '@lit-protocol/vincent-tool-sdk';
import { VincentPolicySpendingLimitMetadata } from '@lit-protocol/vincent-policy-spending-limit';
import { VincentToolErc20ApprovalMetadata } from '@lit-protocol/vincent-tool-erc20-approval';

import { VincentToolUniswapSwapMetadata } from '../../../src';

(async () => {
  await handleAgentWalletPkp({
    vincentToolAndPolicyIpfsCids: [
      VincentToolErc20ApprovalMetadata.ipfsCid,
      VincentToolUniswapSwapMetadata.ipfsCid,
      VincentPolicySpendingLimitMetadata.ipfsCid,
    ],
  });
})();
