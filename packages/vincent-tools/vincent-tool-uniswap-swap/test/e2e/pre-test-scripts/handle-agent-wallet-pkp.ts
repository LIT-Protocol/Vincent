import {
  checkErc20Balance,
  checkNativeTokenBalance,
  getEnv,
  handleAgentWalletPkp,
} from '@lit-protocol/vincent-tool-sdk';
import { VincentPolicySpendingLimitMetadata } from '@lit-protocol/vincent-policy-spending-limit';
import { VincentToolErc20ApprovalMetadata } from '@lit-protocol/vincent-tool-erc20-approval';
import { ethers } from 'ethers';

import { VincentToolUniswapSwapMetadata } from '../../../src';

(async () => {
  const UNISWAP_RPC_URL = getEnv('TEST_UNISWAP_RPC_URL');
  if (UNISWAP_RPC_URL === undefined) {
    console.error(
      `UNISWAP_RPC_URL environment variable is not set. Please set it to the RPC URL to be used to perform the Uniswap Swap.`,
    );
    process.exit(1);
  }

  const WETH_ADDRESS = getEnv('TEST_WETH_ADDRESS');
  if (WETH_ADDRESS === undefined) {
    console.error(
      `WETH_ADDRESS environment variable is not set. Please set it to the WETH address to be used to perform the Uniswap Swap.`,
    );
    process.exit(1);
  }

  const { pkpInfo } = await handleAgentWalletPkp({
    vincentToolAndPolicyIpfsCids: [
      VincentToolErc20ApprovalMetadata.ipfsCid,
      VincentToolUniswapSwapMetadata.ipfsCid,
      VincentPolicySpendingLimitMetadata.ipfsCid,
    ],
  });

  const MIN_ETH_BALANCE = ethers.utils.parseUnits('1', 'wei');
  const { balance, hasMinBalance } = await checkNativeTokenBalance({
    ethAddress: pkpInfo.ethAddress,
    rpcUrl: UNISWAP_RPC_URL,
    minBalance: MIN_ETH_BALANCE,
  });

  if (hasMinBalance) {
    console.log(
      `Agent Wallet PKP (${pkpInfo.ethAddress}) has ${ethers.utils.formatEther(balance)} ETH balance on chain with RPC URL ${UNISWAP_RPC_URL}`,
    );
  } else {
    console.error(
      `Agent Wallet PKP (${pkpInfo.ethAddress}) doesn't have the minimum required balance of ${ethers.utils.formatEther(MIN_ETH_BALANCE)} ETH on chain with RPC URL ${UNISWAP_RPC_URL}. Current balance is ${ethers.utils.formatEther(balance)} ETH. Please fund the Agent Wallet PKP before continuing.`,
    );
    process.exit(1);
  }

  const MIN_WETH_BALANCE = ethers.utils.parseEther('0.0000080');
  const { balance: wethBalance, hasMinBalance: hasMinWethBalance } = await checkErc20Balance({
    ethAddress: pkpInfo.ethAddress,
    rpcUrl: UNISWAP_RPC_URL,
    erc20Address: WETH_ADDRESS,
    minBalance: MIN_WETH_BALANCE,
  });

  if (hasMinWethBalance) {
    console.log(
      `Agent Wallet PKP (${pkpInfo.ethAddress}) has ${ethers.utils.formatEther(wethBalance)} WETH balance on chain with RPC URL ${UNISWAP_RPC_URL}`,
    );
  } else {
    console.error(
      `Agent Wallet PKP (${pkpInfo.ethAddress}) doesn't have the minimum required balance of ${ethers.utils.formatEther(MIN_WETH_BALANCE)} WETH on chain with RPC URL ${UNISWAP_RPC_URL}. Current balance is ${ethers.utils.formatEther(wethBalance)} WETH. Please fund the Agent Wallet PKP before continuing.`,
    );
    process.exit(1);
  }
})();
