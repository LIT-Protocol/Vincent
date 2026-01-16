import { Wallet, providers } from 'ethers';

import { checkFunderBalance, ensureAppManagerFunded, ensureWalletHasTestTokens } from './funding';
import { ensureUnexpiredCapacityToken } from './capacity-credit';

export interface SetupWallets {
  funderWallet: Wallet;
  appManagerWallet: Wallet;
  appDelegateeWallet: Wallet;
  userEoaWallet: Wallet;
  funderWithProvider: Wallet;
  appManagerWithProvider: Wallet;
  appDelegateeWithProvider: Wallet;
  ethersProvider: providers.JsonRpcProvider;
}

/**
 * Create wallets from private keys and fund them with test tokens
 */
export async function setupWallets(
  privateKeys: {
    funder: string;
    appManager: string;
    appDelegatee: string;
    userEoa: string;
  },
  rpcUrl: string,
): Promise<SetupWallets> {
  // Create wallets from private keys
  const funderWallet = new Wallet(privateKeys.funder);
  const appManagerWallet = new Wallet(privateKeys.appManager);
  const appDelegateeWallet = new Wallet(privateKeys.appDelegatee);
  const userEoaWallet = new Wallet(privateKeys.userEoa);

  console.log(`\nFunder: ${funderWallet.address}`);
  console.log(`App Manager: ${appManagerWallet.address}`);
  console.log(`App Delegatee: ${appDelegateeWallet.address}`);
  console.log(`User EOA: ${userEoaWallet.address}`);

  // Create ethers provider for wallet operations on target chain (Base Sepolia)
  const ethersProvider = new providers.JsonRpcProvider(rpcUrl);

  // Connect wallets to provider for ethers operations
  const funderWithProvider = funderWallet.connect(ethersProvider);
  const appManagerWithProvider = appManagerWallet.connect(ethersProvider);
  const appDelegateeWithProvider = appDelegateeWallet.connect(ethersProvider);

  // Check funder balance and fund required accounts on Base Sepolia
  console.log('\n=== Checking Balances and Funding (Base Sepolia) ===');
  await checkFunderBalance(funderWithProvider);
  await ensureAppManagerFunded(appManagerWallet.address, funderWithProvider);

  // Fund app delegatee (needs gas to execute transactions on behalf of users)
  await ensureWalletHasTestTokens({
    address: appDelegateeWallet.address,
    funderWallet: funderWithProvider,
  });

  // Fund user EOA (needs gas to deploy smart account)
  await ensureWalletHasTestTokens({
    address: userEoaWallet.address,
    funderWallet: funderWithProvider,
  });

  // Fund app delegatee on Datil chain for capacity credit minting
  console.log('\n=== Funding on Datil Chain (for Capacity Credits) ===');
  const datilProvider = new providers.JsonRpcProvider('https://yellowstone-rpc.litprotocol.com/');
  const funderOnDatil = funderWallet.connect(datilProvider);

  await ensureWalletHasTestTokens({
    address: appDelegateeWallet.address,
    funderWallet: funderOnDatil,
    minAmountEther: '0.02', // Minimum amount for capacity credit minting
  });

  // Ensure app delegatee has a valid capacity credit (required for executing Lit Actions)
  await ensureUnexpiredCapacityToken(appDelegateeWithProvider);

  return {
    funderWallet,
    appManagerWallet,
    appDelegateeWallet,
    userEoaWallet,
    funderWithProvider,
    appManagerWithProvider,
    appDelegateeWithProvider,
    ethersProvider,
  };
}
