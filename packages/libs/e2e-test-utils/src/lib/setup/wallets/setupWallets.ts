import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  type PublicClient,
  type PrivateKeyAccount,
  Chain,
  formatEther,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';
import { Wallet, providers } from 'ethers';

import { ensureWalletHasUnexpiredCapacityCredit } from './ensureWalletHasUnexpiredCapacityCredit';
import { ensureWalletHasTokens } from './ensureWalletHasTokens';

// Define Chronicle Yellowstone chain (Lit Protocol's testnet)
const chronicleYellowstone = defineChain({
  id: 175188,
  name: 'Chronicle Yellowstone',
  nativeCurrency: {
    decimals: 18,
    name: 'LIT',
    symbol: 'LIT',
  },
  rpcUrls: {
    default: { http: ['https://yellowstone-rpc.litprotocol.com'] },
  },
  blockExplorers: {
    default: {
      name: 'Chronicle Yellowstone Explorer',
      url: 'https://yellowstone-explorer.litprotocol.com',
    },
  },
});

export interface SetupWallets {
  accounts: {
    funder: PrivateKeyAccount;
    appManager: PrivateKeyAccount;
    appDelegatee: PrivateKeyAccount;
    userEoa: PrivateKeyAccount;
  };
  ethersWallets: {
    funder: Wallet;
    appManager: Wallet;
    appDelegatee: Wallet;
    userEoa: Wallet;
  };
  clients: {
    vincentRegistryPublicClient: PublicClient;
    chronicleYellowstonePublicClient: PublicClient;
  };
}

export async function setupWallets({
  privateKeys: { funder, appManager, appDelegatee, userEoa },
  vincentRegistryChain,
  vincentRegistryRpcUrl,
}: {
  privateKeys: {
    funder: `0x${string}`;
    appManager: `0x${string}`;
    appDelegatee: `0x${string}`;
    userEoa: `0x${string}`;
  };
  vincentRegistryChain: Chain;
  vincentRegistryRpcUrl: string;
}): Promise<SetupWallets> {
  console.log('=== Setting up wallets ===');

  const funderAccount = privateKeyToAccount(funder);
  const appManagerAccount = privateKeyToAccount(appManager);
  const appDelegateeAccount = privateKeyToAccount(appDelegatee);
  const userEoaAccount = privateKeyToAccount(userEoa);
  const vincentRegistryPublicClient = createPublicClient({
    chain: vincentRegistryChain,
    transport: http(vincentRegistryRpcUrl),
  });

  const chronicleYellowstonePublicClient = createPublicClient({
    chain: chronicleYellowstone,
    transport: http('https://yellowstone-rpc.litprotocol.com/'),
  });
  const chronicleYellowstoneFunderWalletClient = createWalletClient({
    account: funderAccount,
    chain: chronicleYellowstone,
    transport: http('https://yellowstone-rpc.litprotocol.com/'),
  });

  console.table({
    Funder: funderAccount.address,
    'App Manager': appManagerAccount.address,
    'App Delegatee': appDelegateeAccount.address,
    'User EOA': userEoaAccount.address,
  });

  // Create funder wallet client with account attached for sending transactions
  const funderWalletClient = createWalletClient({
    account: funderAccount,
    chain: vincentRegistryChain,
    transport: http(vincentRegistryRpcUrl),
  });

  // Ensure funder has sufficient balance to fund other wallets
  const funderBalanceOnVincentRegistryChain = await ensureWalletHasTokens({
    address: funderAccount.address,
    funderWalletClient,
    publicClient: vincentRegistryPublicClient,
    minAmount: parseEther('0.006'),
    dontFund: true,
  });

  const funderBalanceOnChronicleYellowstone = await ensureWalletHasTokens({
    address: funderAccount.address,
    funderWalletClient,
    publicClient: chronicleYellowstonePublicClient,
    minAmount: parseEther('0.06'),
    dontFund: true,
  });

  // Ensure app manager has sufficient balance to register app and app versions
  const appManagerBalance = await ensureWalletHasTokens({
    address: appManagerAccount.address,
    funderWalletClient,
    publicClient: vincentRegistryPublicClient,
    minAmount: parseEther('0.002'),
  });

  // Ensure user EOA has sufficient balance to deploy smart account
  const userEoaBalance = await ensureWalletHasTokens({
    address: userEoaAccount.address,
    funderWalletClient,
    publicClient: vincentRegistryPublicClient,
    minAmount: parseEther('0.002'),
  });

  // Ensure app delegatee has sufficient balance to mint capacity credits
  // to execute Vincent abilities on behalf of users
  const appDelegateeBalance = await ensureWalletHasTokens({
    address: appDelegateeAccount.address,
    funderWalletClient: chronicleYellowstoneFunderWalletClient,
    publicClient: chronicleYellowstonePublicClient,
    minAmount: parseEther('0.05'),
  });

  // Ensure app delegatee has a valid capacity credit (required for executing Lit Actions)
  await ensureWalletHasUnexpiredCapacityCredit({ privateKey: appDelegatee });

  console.table({
    'Funder on Vincent Registry Chain': {
      Balance: formatEther(funderBalanceOnVincentRegistryChain.currentBalance),
      FundingTxHash: funderBalanceOnVincentRegistryChain.fundingTxHash,
    },
    'Funder on Chronicle Yellowstone': {
      Balance: formatEther(funderBalanceOnChronicleYellowstone.currentBalance),
      FundingTxHash: funderBalanceOnChronicleYellowstone.fundingTxHash,
    },
    'App Manager': {
      Balance: formatEther(appManagerBalance.currentBalance),
      FundingTxHash: appManagerBalance.fundingTxHash,
    },
    'User EOA': {
      Balance: formatEther(userEoaBalance.currentBalance),
      FundingTxHash: userEoaBalance.fundingTxHash,
    },
    'App Delegatee': {
      Balance: formatEther(appDelegateeBalance.currentBalance),
      FundingTxHash: appDelegateeBalance.fundingTxHash,
    },
  });

  // Create ethers wallets for compatibility with Vincent ability client
  const ethersProvider = new providers.JsonRpcProvider(vincentRegistryRpcUrl);
  const funderEthersWallet = new Wallet(funder, ethersProvider);
  const appManagerEthersWallet = new Wallet(appManager, ethersProvider);
  const appDelegateeEthersWallet = new Wallet(appDelegatee, ethersProvider);
  const userEoaEthersWallet = new Wallet(userEoa, ethersProvider);

  return {
    accounts: {
      funder: funderAccount,
      appManager: appManagerAccount,
      appDelegatee: appDelegateeAccount,
      userEoa: userEoaAccount,
    },
    ethersWallets: {
      funder: funderEthersWallet,
      appManager: appManagerEthersWallet,
      appDelegatee: appDelegateeEthersWallet,
      userEoa: userEoaEthersWallet,
    },
    clients: {
      vincentRegistryPublicClient,
      chronicleYellowstonePublicClient,
    },
  };
}
