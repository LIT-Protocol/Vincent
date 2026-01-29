import type { Chain, PublicClient } from 'viem';
import type { PrivateKeyAccount } from 'viem/accounts';

import { Wallet, providers } from 'ethers';
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  parseEther,
  formatEther,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { ensureWalletHasCapacityCredit } from './ensureWalletHasCapacityCredit';
import { ensureWalletHasTokens } from './ensureWalletHasTokens';

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

interface FundingConfig {
  funder?: {
    minAmountVincentRegistryChain?: bigint;
    minAmountChronicleYellowstone?: bigint;
  };
  appManagerMinAmount?: {
    minAmountVincentRegistryChain?: bigint;
  };
  userEoaMinAmount?: {
    minAmountVincentRegistryChain?: bigint;
  };
  appDelegateeMinAmount?: {
    minAmountChronicleYellowstone?: bigint;
  };
}

export async function setupWallets({
  privateKeys: { funder, appManager, appDelegatee, userEoa },
  vincentRegistryChain,
  vincentRegistryRpcUrl,
  funding: userFunding,
}: {
  privateKeys: {
    funder: `0x${string}`;
    appManager: `0x${string}`;
    appDelegatee: `0x${string}`;
    userEoa: `0x${string}`;
  };
  vincentRegistryChain: Chain;
  vincentRegistryRpcUrl: string;
  funding?: FundingConfig;
}): Promise<SetupWallets> {
  console.log('=== Setting up wallets and funding them ===');

  const funding = {
    funder: {
      minAmountVincentRegistryChain:
        userFunding?.funder?.minAmountVincentRegistryChain ?? parseEther('0.006'),
      minAmountChronicleYellowstone:
        userFunding?.funder?.minAmountChronicleYellowstone ?? parseEther('0.06'),
    },
    appManagerMinAmount: {
      minAmountVincentRegistryChain:
        userFunding?.appManagerMinAmount?.minAmountVincentRegistryChain ?? parseEther('0.002'),
    },
    userEoaMinAmount: {
      minAmountVincentRegistryChain:
        userFunding?.userEoaMinAmount?.minAmountVincentRegistryChain ?? parseEther('0.002'),
    },
    appDelegateeMinAmount: {
      minAmountChronicleYellowstone:
        userFunding?.appDelegateeMinAmount?.minAmountChronicleYellowstone ?? parseEther('0.05'),
    },
  };

  const funderAccount = privateKeyToAccount(funder);
  const appManagerAccount = privateKeyToAccount(appManager);
  const appDelegateeAccount = privateKeyToAccount(appDelegatee);
  const userEoaAccount = privateKeyToAccount(userEoa);
  const vincentRegistryPublicClient = createPublicClient({
    chain: vincentRegistryChain,
    transport: http(vincentRegistryRpcUrl),
  }) as PublicClient;

  const chronicleYellowstonePublicClient = createPublicClient({
    chain: chronicleYellowstone,
    transport: http('https://yellowstone-rpc.litprotocol.com/'),
  }) as PublicClient;
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
    minAmount: funding.funder.minAmountVincentRegistryChain,
    dontFund: true,
  });

  const funderBalanceOnChronicleYellowstone = await ensureWalletHasTokens({
    address: funderAccount.address,
    funderWalletClient,
    publicClient: chronicleYellowstonePublicClient,
    minAmount: funding.funder.minAmountChronicleYellowstone,
    dontFund: true,
  });

  // Ensure app manager has sufficient balance to register app and app versions
  const appManagerBalance = await ensureWalletHasTokens({
    address: appManagerAccount.address,
    funderWalletClient,
    publicClient: vincentRegistryPublicClient,
    minAmount: funding.appManagerMinAmount.minAmountVincentRegistryChain,
  });

  // Ensure user EOA has sufficient balance to deploy smart account
  const userEoaBalance = await ensureWalletHasTokens({
    address: userEoaAccount.address,
    funderWalletClient,
    publicClient: vincentRegistryPublicClient,
    minAmount: funding.userEoaMinAmount.minAmountVincentRegistryChain,
  });

  // Ensure app delegatee has sufficient balance to mint capacity credits
  // to execute Vincent abilities on behalf of users
  const appDelegateeBalance = await ensureWalletHasTokens({
    address: appDelegateeAccount.address,
    funderWalletClient: chronicleYellowstoneFunderWalletClient,
    publicClient: chronicleYellowstonePublicClient,
    minAmount: funding.appDelegateeMinAmount.minAmountChronicleYellowstone,
  });

  // Ensure app delegatee has a valid capacity credit (required for executing Lit Actions)
  await ensureWalletHasCapacityCredit({ privateKey: appDelegatee });

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
