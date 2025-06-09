import { ethers } from 'ethers';
import {
  checkNativeTokenBalance,
  getEnv,
  handleVincentApp,
  VINCENT_APP_PARAMETER_TYPE,
} from '@lit-protocol/vincent-tool-sdk';
import { VincentPolicySpendingLimitMetadata } from '@lit-protocol/vincent-policy-spending-limit';
import { VincentToolErc20ApprovalMetadata } from '@lit-protocol/vincent-tool-erc20-approval';
import { LIT_NETWORK, RPC_URL_BY_NETWORK } from '@lit-protocol/constants';

import { VincentToolUniswapSwapMetadata } from '../../../src';

(async () => {
  const TEST_VINCENT_APP_DELEGATEE_PRIVATE_KEY = getEnv('TEST_VINCENT_APP_DELEGATEE_PRIVATE_KEY');
  if (TEST_VINCENT_APP_DELEGATEE_PRIVATE_KEY === undefined) {
    console.error('TEST_VINCENT_APP_DELEGATEE_PRIVATE_KEY environment variable is not set');
    process.exit(1);
  }
  const testVincentAppDelegateeWallet = new ethers.Wallet(TEST_VINCENT_APP_DELEGATEE_PRIVATE_KEY);

  const MIN_ETH_BALANCE = ethers.utils.parseEther('0.01');
  const { balance, hasMinBalance } = await checkNativeTokenBalance({
    ethAddress: testVincentAppDelegateeWallet.address,
    rpcUrl: RPC_URL_BY_NETWORK[LIT_NETWORK.Datil],
    minBalance: MIN_ETH_BALANCE,
  });
  if (!hasMinBalance) {
    console.error(
      `App Delegatee (${testVincentAppDelegateeWallet.address}) doesn't have the minimum required balance of ${ethers.utils.formatEther(MIN_ETH_BALANCE)} ETH on the Lit Datil network. Current balance is ${ethers.utils.formatEther(balance)} ETH. Please fund the App Manager before continuing using the Lit test token faucet: https://chronicle-yellowstone-faucet.getlit.dev/.`,
    );
    process.exit(1);
  }

  await handleVincentApp({
    vincentTools: [
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
    ],
    vincentAppDelegatees: [testVincentAppDelegateeWallet.address],
  });
})();
