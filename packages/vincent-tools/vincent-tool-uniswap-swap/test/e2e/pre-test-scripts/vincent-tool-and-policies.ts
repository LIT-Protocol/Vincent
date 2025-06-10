import { VINCENT_APP_PARAMETER_TYPE } from '@lit-protocol/vincent-tool-sdk';
import { VincentToolErc20ApprovalMetadata } from '@lit-protocol/vincent-tool-erc20-approval';
import { VincentPolicySpendingLimitMetadata } from '@lit-protocol/vincent-policy-spending-limit';
import { ethers } from 'ethers';

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

export const vincentToolsWithValuesForAgentWalletPkp = [
  {
    ipfsCid: VincentToolErc20ApprovalMetadata.ipfsCid,
    policies: [], // No policies for ERC20 Approval Tool
  },
  {
    ipfsCid: VincentToolUniswapSwapMetadata.ipfsCid,
    policies: [
      {
        ipfsCid: VincentPolicySpendingLimitMetadata.ipfsCid,
        parameterNames: ['maxDailySpendingLimitInUsdCents'],
        parameterTypes: [VINCENT_APP_PARAMETER_TYPE.UINT256],
        parameterValues: [
          {
            name: 'maxDailySpendingLimitInUsdCents',
            value: ethers.utils.defaultAbiCoder.encode(
              ['uint256'],
              [ethers.BigNumber.from('1000000000')], // maxDailySpendingLimitInUsdCents $10 USD (8 decimals)
            ),
          },
        ],
      },
    ],
  },
];
