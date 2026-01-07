import { formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import {
  BASE_SEPOLIA_PUBLIC_CLIENT,
  TEST_APP_MANAGER_PRIVATE_KEY,
  TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY,
  TEST_FUNDER_BASE_SEPOLIA_WALLET_CLIENT,
} from './test-variables';

/**
 * Funds the APP_MANAGER account on Base Sepolia if they have no balance
 * The APP_MANAGER needs funds to interact with Vincent contracts on Base Sepolia
 */
export const fundAppManagerOnBaseSepoliaIfNeeded = async (): Promise<void> => {
  const appManagerAccount = privateKeyToAccount(TEST_APP_MANAGER_PRIVATE_KEY as `0x${string}`);
  const appManagerBalance = await BASE_SEPOLIA_PUBLIC_CLIENT.getBalance({
    address: appManagerAccount.address,
  });

  console.log(`ℹ️  APP_MANAGER balance on Base Sepolia: ${formatEther(appManagerBalance)} ETH`);

  if (appManagerBalance < 2000000000000000n) {
    console.log('ℹ️  Funding APP_MANAGER on Base Sepolia with 0.002 ETH...');
    const fundTx = await TEST_FUNDER_BASE_SEPOLIA_WALLET_CLIENT.sendTransaction({
      to: appManagerAccount.address,
      value: 2000000000000000n, // 0.002 ETH in wei
    });
    await BASE_SEPOLIA_PUBLIC_CLIENT.waitForTransactionReceipt({ hash: fundTx });
    console.log(`✅ Funded APP_MANAGER with 0.002 ETH on Base Sepolia\nTx hash: ${fundTx}`);
  }
};

/**
 * Funds the USER (PKP Owner) account on Base Sepolia if they have no balance
 * The USER needs funds to interact with Vincent contracts on Base Sepolia
 */
export const fundUserOnBaseSepoliaIfNeeded = async (): Promise<void> => {
  const userAccount = privateKeyToAccount(TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY as `0x${string}`);
  const userBalance = await BASE_SEPOLIA_PUBLIC_CLIENT.getBalance({
    address: userAccount.address,
  });

  console.log(`ℹ️  USER balance on Base Sepolia: ${formatEther(userBalance)} ETH`);

  if (userBalance < 100000000000000n) {
    console.log('ℹ️  Funding USER on Base Sepolia with 0.0001 ETH...');
    const fundTx = await TEST_FUNDER_BASE_SEPOLIA_WALLET_CLIENT.sendTransaction({
      to: userAccount.address,
      value: 100000000000000n, // 0.0001 ETH in wei
    });
    await BASE_SEPOLIA_PUBLIC_CLIENT.waitForTransactionReceipt({ hash: fundTx });
    console.log(`✅ Funded USER with 0.0001 ETH on Base Sepolia\nTx hash: ${fundTx}`);
  }
};
