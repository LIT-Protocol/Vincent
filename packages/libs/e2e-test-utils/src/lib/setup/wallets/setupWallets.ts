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
  const funderAccount = privateKeyToAccount(funder);
  const appManagerAccount = privateKeyToAccount(appManager);
  const appDelegateeAccount = privateKeyToAccount(appDelegatee);
  const userEoaAccount = privateKeyToAccount(userEoa);
  const vincentRegistryPublicClient = createPublicClient({
    chain: vincentRegistryChain,
    transport: http(vincentRegistryRpcUrl),
  });

  // Create funder wallet client with account attached for sending transactions
  const funderWalletClient = createWalletClient({
    account: funderAccount,
    chain: vincentRegistryChain,
    transport: http(vincentRegistryRpcUrl),
  });

  console.table([
    { Name: 'Funder', Address: funderAccount.address },
    { Name: 'App Manager', Address: appManagerAccount.address },
    { Name: 'App Delegatee', Address: appDelegateeAccount.address },
    { Name: 'User EOA', Address: userEoaAccount.address },
  ]);

  // Ensure funder has sufficient balance to fund other wallets
  const funderBalance = await ensureWalletHasTokens({
    address: funderAccount.address,
    funderWalletClient,
    publicClient: vincentRegistryPublicClient,
    minAmount: parseEther('0.15'),
  });

  // Ensure app manager has sufficient balance to register app and app versions
  const appManagerBalance = await ensureWalletHasTokens({
    address: appManagerAccount.address,
    funderWalletClient,
    publicClient: vincentRegistryPublicClient,
    minAmount: parseEther('0.05'),
  });

  // Ensure user EOA has sufficient balance to deploy smart account
  const userEoaBalance = await ensureWalletHasTokens({
    address: userEoaAccount.address,
    funderWalletClient,
    publicClient: vincentRegistryPublicClient,
    minAmount: parseEther('0.05'),
  });

  // Fund app delegatee on Chronicle Yellowstone for capacity credit minting
  const chronicleYellowstonePublicClient = createPublicClient({
    chain: chronicleYellowstone,
    transport: http('https://yellowstone-rpc.litprotocol.com/'),
  });

  // Create funder wallet client for Chronicle Yellowstone with account attached
  const chronicleYellowstoneFunderWalletClient = createWalletClient({
    account: funderAccount,
    chain: chronicleYellowstone,
    transport: http('https://yellowstone-rpc.litprotocol.com/'),
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
  const capacityCreditInfo = await ensureWalletHasUnexpiredCapacityCredit({
    privateKey: appDelegatee,
  });

  console.table([
    {
      Name: 'Funder',
      Address: funderAccount.address,
      Balance: formatEther(funderBalance.currentBalance),
      FundingTxHash: funderBalance.fundingTxHash,
    },
    {
      Name: 'App Manager',
      Address: appManagerAccount.address,
      Balance: formatEther(appManagerBalance.currentBalance),
      FundingTxHash: appManagerBalance.fundingTxHash,
    },
    {
      Name: 'User EOA',
      Address: userEoaAccount.address,
      Balance: formatEther(userEoaBalance.currentBalance),
      FundingTxHash: userEoaBalance.fundingTxHash,
    },
    {
      Name: 'App Delegatee',
      Address: appDelegateeAccount.address,
      Balance: formatEther(appDelegateeBalance.currentBalance),
      FundingTxHash: appDelegateeBalance.fundingTxHash,
    },
    capacityCreditInfo.mintedNewCapacityCredit
      ? {
          Name: 'Minted New Capacity Credit',
          CapacityTokenId: capacityCreditInfo.newCapacityCreditInfo!.capacityTokenId,
        }
      : { Name: 'Used Existing Capacity Credit' },
  ]);

  return {
    accounts: {
      funder: funderAccount,
      appManager: appManagerAccount,
      appDelegatee: appDelegateeAccount,
      userEoa: userEoaAccount,
    },
    clients: {
      vincentRegistryPublicClient,
      chronicleYellowstonePublicClient,
    },
  };
}
