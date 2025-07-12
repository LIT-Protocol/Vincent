import { createVincentTool, supportedPoliciesForTool } from '@lit-protocol/vincent-tool-sdk';
import { ethers } from 'ethers';

import { getCurrentAllowance, checkNativeTokenBalance } from './helpers';
import { sendErc20ApprovalTx } from './lit-action-helpers';
import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  toolParamsSchema,
} from './schemas';

export const vincentTool = createVincentTool({
  packageName: '@lit-protocol/vincent-tool-erc20-approval' as const,
  toolParamsSchema,
  supportedPolicies: supportedPoliciesForTool([]),

  precheckSuccessSchema,
  precheckFailSchema,

  executeSuccessSchema,
  executeFailSchema,

  precheck: async ({ toolParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    const { ethAddress } = delegatorPkpInfo;
    const { rpcUrl, spenderAddress, tokenAddress, tokenDecimals, tokenAmount } = toolParams;

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    const hasNativeTokenBalance = await checkNativeTokenBalance({
      provider,
      pkpEthAddress: ethAddress,
    });

    if (!hasNativeTokenBalance) {
      return fail({ noNativeTokenBalance: true });
    }

    const currentAllowance = await getCurrentAllowance({
      provider,
      tokenAddress,
      owner: ethAddress,
      spender: spenderAddress,
    });

    const requiredAmount = ethers.utils.parseUnits(tokenAmount.toString(), tokenDecimals);

    return succeed({
      alreadyApproved: currentAllowance == requiredAmount.toBigInt(),
      currentAllowance: currentAllowance.toString(),
    });
  },
  execute: async ({ toolParams }, { succeed, delegation: { delegatorPkpInfo } }) => {
    console.log('Executing ERC20 Approval Tool');

    const { ethAddress, publicKey } = delegatorPkpInfo;
    const { rpcUrl, chainId, spenderAddress, tokenAddress, tokenDecimals, tokenAmount } =
      toolParams;

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    await checkNativeTokenBalance({
      provider,
      pkpEthAddress: ethAddress,
    });

    const currentAllowance = await getCurrentAllowance({
      provider,
      tokenAddress,
      owner: ethAddress,
      spender: spenderAddress,
    });
    const requiredAmount = ethers.utils
      .parseUnits(tokenAmount.toString(), tokenDecimals)
      .toBigInt();

    console.log(
      `currentAllowance: ${currentAllowance} >= requiredAmount: ${requiredAmount} (execute)`,
    );

    if (currentAllowance === requiredAmount) {
      console.log('Tool execution successful', {
        approvedAmount: currentAllowance.toString(),
        spenderAddress,
        tokenAddress,
        tokenDecimals: parseInt(tokenDecimals.toString()),
      });

      return succeed({
        approvedAmount: currentAllowance.toString(),
        tokenAddress,
        tokenDecimals: parseInt(tokenDecimals.toString()),
        spenderAddress,
      });
    }

    const approvalTxHash = await sendErc20ApprovalTx({
      rpcUrl,
      chainId,
      pkpEthAddress: ethAddress,
      pkpPublicKey: publicKey,
      spenderAddress,
      tokenAmount: requiredAmount,
      tokenAddress,
    });

    console.log('Tool execution successful', {
      approvalTxHash,
      approvedAmount: requiredAmount.toString(),
      spenderAddress,
      tokenAddress,
      tokenDecimals: parseInt(tokenDecimals.toString()),
    });

    return succeed({
      approvalTxHash,
      approvedAmount: requiredAmount.toString(),
      tokenAddress,
      tokenDecimals: parseInt(tokenDecimals.toString()),
      spenderAddress,
    });
  },
});
